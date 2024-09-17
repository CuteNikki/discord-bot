import type { Types } from 'mongoose';

import type { DiscordClient } from 'classes/client';

import { levelModel } from 'models/level';
import { weeklyLevelModel } from 'models/weeklyLevels';

export interface LevelIdentifier {
  userId: string;
  guildId: string;
}

export interface Level {
  _id: Types.ObjectId;
  userId: string;
  guildId: string;
  level: number;
  xp: number;
}

export interface PositionLevel extends Level {
  position: number;
  username: string;
}

export interface LevelReward {
  roleId: string;
  level: number;
}

export function randomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function levelToXP(level: number): number {
  return level * 200;
}

export function xpToLevel(xp: number): number {
  return Math.floor(xp / 200);
}

export function randomXP(): number {
  return randomInteger(5, 15);
}

export function getData(identifier: LevelIdentifier, client: DiscordClient) {
  return levelModel.findOne({ userId: identifier.userId, guildId: identifier.guildId }, {}, { upsert: false }).lean().exec();
}

export async function getDataOrCreate(identifier: LevelIdentifier, client: DiscordClient): Promise<Level> {
  return await levelModel.findOneAndUpdate({ userId: identifier.userId, guildId: identifier.guildId }, {}, { new: true, upsert: true }).lean().exec();
}

export function getWeeklyData(identifier: LevelIdentifier, client: DiscordClient) {
  return weeklyLevelModel.findOne({ userId: identifier.userId, guildId: identifier.guildId }, {}, { upsert: false }).lean().exec();
}

export async function getWeeklyDataOrCreate(identifier: LevelIdentifier, client: DiscordClient): Promise<Level> {
  return await weeklyLevelModel.findOneAndUpdate({ userId: identifier.userId, guildId: identifier.guildId }, {}, { new: true, upsert: true }).lean().exec();
}

export async function appendXP(identifier: LevelIdentifier, client: DiscordClient, xp: number, current?: Level): Promise<Level> {
  if (!current) current = await getDataOrCreate(identifier, client);
  const level = xpToLevel(current.xp + xp);
  const currentWeekly = await getWeeklyDataOrCreate(identifier, client);
  const weeklyLevel = xpToLevel(currentWeekly.xp + xp);
  const newWeeklyLevel = await weeklyLevelModel
    .findOneAndUpdate({ userId: identifier.userId, guildId: identifier.guildId }, { $inc: { xp }, $set: { level: weeklyLevel } }, { upsert: true, new: true })
    .lean()
    .exec();
  const newLevel = await levelModel
    .findOneAndUpdate({ userId: identifier.userId, guildId: identifier.guildId }, { $inc: { xp }, $set: { level: level } }, { upsert: true, new: true })
    .lean()
    .exec();
  return newLevel;
}

export async function setXP(identifier: LevelIdentifier, client: DiscordClient, xp: number): Promise<Level> {
  if (xp > 200000) xp = 200000;
  if (xp < 0) xp = 0;
  const level = xpToLevel(xp);
  const newLevel = await levelModel
    .findOneAndUpdate({ userId: identifier.userId, guildId: identifier.guildId }, { $set: { level, xp } }, { upsert: true, new: true })
    .lean()
    .exec();
  return newLevel;
}

export async function addXP(identifier: LevelIdentifier, client: DiscordClient, xp: number): Promise<Level> {
  const current = await getDataOrCreate(identifier, client);
  if (current.xp + xp > 200000) xp = 200000;
  if (current.xp + xp < 0) xp = 0;
  const level = xpToLevel(current.xp + xp);
  const newLevel = await levelModel
    .findOneAndUpdate({ userId: identifier.userId, guildId: identifier.guildId }, { $inc: { xp }, $set: { level } }, { upsert: true, new: true })
    .lean()
    .exec();
  return newLevel;
}

export async function setLevel(identifier: LevelIdentifier, client: DiscordClient, level: number): Promise<Level> {
  if (level > 1000) level = 1000;
  if (level < 0) level = 0;
  const xp = levelToXP(level);
  const newLevel = await levelModel
    .findOneAndUpdate({ userId: identifier.userId, guildId: identifier.guildId }, { $set: { level, xp } }, { upsert: true, new: true })
    .lean()
    .exec();
  return newLevel;
}

export async function addLevel(identifier: LevelIdentifier, client: DiscordClient, level: number): Promise<Level> {
  const current = await getDataOrCreate(identifier, client);
  if (current.level + level > 1000) level = 1000;
  if (current.level + level < 0) level = 0;
  const xp = levelToXP(current.level + level);
  const newLevel = await levelModel
    .findOneAndUpdate({ userId: identifier.userId, guildId: identifier.guildId }, { $set: { level, xp } }, { upsert: true, new: true })
    .lean()
    .exec();
  return newLevel;
}

export async function getLevelRewards(client: DiscordClient, level: Level | PositionLevel): Promise<LevelReward[]> {
  const guildSettings = await client.getGuildSettings(level.guildId);
  if (!guildSettings) return [];
  const rewards = guildSettings.level.rewards.filter((rw) => rw.level <= level.level);
  return rewards;
}

export async function getDataWithRank(identifier: LevelIdentifier, client: DiscordClient): Promise<PositionLevel | undefined> {
  return (await computeLeaderboard(await getLeaderboard(identifier.guildId), client)).find((level) => level.userId === identifier.userId);
}

export async function getWeeklyDataWithRank(identifier: LevelIdentifier, client: DiscordClient): Promise<PositionLevel | undefined> {
  return (await computeLeaderboard(await getWeeklyLeaderboard(identifier.guildId), client)).find((level) => level.userId === identifier.userId);
}

export async function getLeaderboard(guildId: string): Promise<Level[]> {
  return await levelModel
    .find({ guildId })
    .sort([['xp', 'descending']])
    .lean()
    .exec();
}

export async function getWeeklyLeaderboard(guildId: string): Promise<Level[]> {
  return await weeklyLevelModel
    .find({ guildId })
    .sort([['xp', 'descending']])
    .lean()
    .exec();
}

export async function computeLeaderboard(leaderboard: Level[], client: DiscordClient): Promise<PositionLevel[]> {
  const computedLeaderboard: PositionLevel[] = [];

  for (const level of leaderboard) {
    const usernames = await client.cluster.broadcastEval(
      (c, { userId }) => {
        const user = c.users.cache.get(userId);
        if (user) return user.username;
        return false;
      },
      { context: { userId: level.userId } },
    );
    const username = usernames.find((name) => typeof name === 'string');
    const position = leaderboard.findIndex((lvl) => lvl.userId === level.userId) + 1;

    computedLeaderboard.push({
      ...level,
      position,
      username: username || `<@${level.userId}>`,
    });
  }

  return computedLeaderboard;
}

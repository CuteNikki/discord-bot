import type { UpdateQuery } from 'mongoose';

import type { DiscordClient } from 'classes/client';

import { getGuildSettings } from 'db/guild';
import type { LevelReward } from 'models/guild';
import { levelModel, type Level, type PositionLevel } from 'models/level';

import { weeklyLevelModel, type WeeklyLevel } from 'models/weeklyLevel';
import { getRandomNumber } from 'utils/common';

/**
 * XP required for a level
 */
const XP_PER_LEVEL = 200;

/**
 * Converts a level to XP
 * @param {number} level
 * @returns {number} Total XP for the level
 */
export function convertLevelToXP(level: number): number {
  return level * XP_PER_LEVEL;
}

/**
 * Converts XP to a level
 * @param {number} xp
 * @returns {number} Level for the XP
 */
export function convertXpToLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL);
}

/**
 * Gets a random amount of XP
 * @returns {number} a number between 5 and 15
 */
export function getRandomXP(): number {
  return getRandomNumber(5, 15);
}

/**
 * Gets the level and xp for a user in a guild
 * @param {string} userId
 * @param {string} guildId
 * @returns {Promise<Level | null>} level object or null if not found
 */
export async function getLevel(userId: string, guildId: string): Promise<Level | null> {
  return await levelModel.findOne({ userId, guildId }, {}, { upsert: false }).lean().exec();
}

/**
 * Gets or creates the level and xp for a user in a guild
 * @param {string} userId
 * @param {string} guildId
 * @param {UpdateQuery<Level>} updateQuery
 * @returns {Promise<Level>} level object
 */
export async function getLevelForce(userId: string, guildId: string, updateQuery: UpdateQuery<Level> = {}): Promise<Level> {
  return await levelModel.findOneAndUpdate({ userId, guildId }, updateQuery, { upsert: true, new: true }).lean().exec();
}

/**
 * Gets the weekly level and xp for a user in a guild
 * @param {string} userId
 * @param {string} guildId
 * @returns {Promise<WeeklyLevel | null>} level object or null if not found
 */
export async function getWeeklyLevel(userId: string, guildId: string): Promise<Level | null> {
  return await weeklyLevelModel.findOne({ userId, guildId }, {}, { upsert: false }).lean().exec();
}

/**
 * Gets or creates the weekly level and xp for a user in a guild
 * @param {string} userId
 * @param {string} guildId
 * @param {UpdateQuery<WeeklyLevel>} updateQuery
 * @returns {Promise<WeeklyLevel>} level object
 */
export async function getWeeklyLevelForce(userId: string, guildId: string, updateQuery: UpdateQuery<Level> = {}): Promise<Level> {
  return await weeklyLevelModel.findOneAndUpdate({ userId, guildId }, updateQuery, { upsert: true, new: true }).lean().exec();
}

/**
 * Adds XP to a user in a guild (also updates weekly level)
 * @param {string} userId
 * @param {string} guildId
 * @param {number} xp
 * @returns {Promise<Level>} Updated level object
 */
export async function appendXP(userId: string, guildId: string, xp: number): Promise<Level> {
  // Handle weekly level
  const currentWeekly = await getWeeklyLevelForce(userId, guildId);
  const weeklyLevel = convertXpToLevel(currentWeekly.xp + xp);
  await weeklyLevelModel
    .findOneAndUpdate({ userId, guildId }, { $inc: { xp }, $set: { level: weeklyLevel } }, { upsert: true, new: true })
    .lean()
    .exec();

  // Handle current level
  const current = await getLevelForce(userId, guildId);
  const level = convertXpToLevel(current.xp + xp);
  return await levelModel
    .findOneAndUpdate({ userId, guildId }, { $inc: { xp }, $set: { level: level } }, { upsert: true, new: true })
    .lean()
    .exec();
}

/**
 * Set the xp of a user in a guild
 * @param {string} userId
 * @param {string} guildId
 * @param {number} xp
 * @returns {Promise<Level>} Updated level object
 */
export async function setXP(userId: string, guildId: string, xp: number): Promise<Level> {
  // Verify that the XP is within the allowed range
  if (xp > 200000) xp = 200000;
  if (xp < 0) xp = 0;

  const level = convertXpToLevel(xp);
  return await levelModel.findOneAndUpdate({ userId, guildId }, { $set: { level, xp } }, { upsert: true, new: true }).lean().exec();
}

/**
 * Adds XP to a user in a guild (does not update weekly level)
 * @param {string} userId
 * @param {string} guildId
 * @param {number} xp
 * @returns {Promise<Level>} Updated level object
 */
export async function addXP(userId: string, guildId: string, xp: number): Promise<Level> {
  // Verify that the XP is within the allowed range
  if (xp > 200000) xp = 200000;
  if (xp < 0) xp = 0;

  const level = convertXpToLevel(xp);
  return await levelModel.findOneAndUpdate({ userId, guildId }, { $inc: { xp }, $set: { level } }, { upsert: true, new: true }).lean().exec();
}

/**
 * Sets the level of a user in a guild (does not update weekly level)
 * @param {string} userId
 * @param {string} guildId
 * @param {number} level
 * @returns {Promise<Level>} Updated level object
 */
export async function setLevel(userId: string, guildId: string, level: number): Promise<Level> {
  // Verify that the level is within the allowed range
  if (level > 1000) level = 1000;
  if (level < 0) level = 0;

  const xp = convertLevelToXP(level);
  return await levelModel.findOneAndUpdate({ userId, guildId }, { $set: { level, xp } }, { upsert: true, new: true }).lean().exec();
}

/**
 * Adds level to a user in a guild (does not update weekly level)
 * @param {string} userId
 * @param {string} guildId
 * @param {number} level
 * @returns {Promise<Level>} Updated level object
 */
export async function addLevel(userId: string, guildId: string, level: number): Promise<Level> {
  // Verify that the level is within the allowed range
  if (level > 1000) level = 1000;
  if (level < 0) level = 0;

  const xp = convertLevelToXP(level);
  return await levelModel.findOneAndUpdate({ userId, guildId }, { $inc: { xp }, $set: { level } }, { upsert: true, new: true }).lean().exec();
}

/**
 * Gets the rewards for a level
 * @param {Level | PositionLevel} level
 * @returns {Promise<LevelReward[]>} Rewards for the level
 */
export async function getRewardsForLevel(level: Level | PositionLevel): Promise<LevelReward[]> {
  const guildSettings = await getGuildSettings(level.guildId);
  if (!guildSettings) return [];

  return guildSettings.level.rewards.filter((rw) => rw.level <= level.level);
}

/**
 * Gets the level of a user in a guild with position on the leaderboard
 * @param {string} userId
 * @param {string} guildId
 * @returns {Promise<PositionLevel | undefined>} Level object or undefined if not found
 */
export async function getLevelWithRank(userId: string, guildId: string): Promise<PositionLevel | undefined> {
  const levels = await getLeaderboard(guildId);
  const level = levels.find((lvl) => lvl.userId === userId);
  const position = levels.findIndex((lvl) => lvl.userId === userId) + 1;

  return level ? { ...level, position } : undefined;
}

/**
 * Get the level of a user in a guild with position on the weekly leaderboard
 * @param {string} userId
 * @param {string} guildId
 * @returns {Promise<PositionLevel | undefined>} Level object or undefined if not found
 */
export async function getWeeklyLevelWithRank(userId: string, guildId: string): Promise<PositionLevel | undefined> {
  const weeklyLevels = await getWeeklyLeaderboard(guildId);
  const weeklyLevel = weeklyLevels.find((lvl) => lvl.userId === userId);
  const position = weeklyLevels.findIndex((lvl) => lvl.userId === userId) + 1;

  return weeklyLevel ? { ...weeklyLevel, position } : undefined;
}

/**
 * Returns the leaderboard for a guild
 * @param {string} guildId
 * @returns {Promise<Level[]>} Leaderboard
 */
export async function getLeaderboard(guildId: string): Promise<Level[]> {
  return await levelModel
    .find({ guildId })
    .sort([['xp', 'descending']])
    .lean()
    .exec();
}

/**
 * Returns the weekly leaderboard for a guild
 * @param {string} guildId
 * @returns {Promise<WeeklyLevel[]>} Leaderboard
 */
export async function getWeeklyLeaderboard(guildId: string): Promise<WeeklyLevel[]> {
  return await weeklyLevelModel
    .find({ guildId })
    .sort([['xp', 'descending']])
    .lean()
    .exec();
}

/**
 * Adds a username to each level in the leaderboard
 * @param {Level[] | WeeklyLevel[]} leaderboard
 * @param {DiscordClient} client
 * @returns {Promise<PositionLevel[]>} Leaderboard with usernames
 */
export async function computeLeaderboard(leaderboard: Level[] | WeeklyLevel[], client: DiscordClient): Promise<PositionLevel[]> {
  return leaderboard.map((level, index) => ({ ...level, position: index + 1, username: client.users.cache.get(level.userId)?.username }));
}
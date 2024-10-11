import type { DiscordClient } from 'classes/client';
import type { Types, UpdateQuery } from 'mongoose';

import { updateGuild } from 'db/guild';
import { levelConfigModel, levelModel, weeklyLevelModel } from 'models/level';

import { getRandomNumber } from 'utils/common';

import type { AnnouncementType, LevelReward } from 'types/guild';
import type { LevelConfigDocument, LevelDocument, PositionLevel, WeeklyLevelDocument } from 'types/level';

export async function getLevelConfig<T extends boolean>(
  guildId: string,
  insert: T = false as T
): Promise<T extends true ? LevelConfigDocument : LevelConfigDocument | null> {
  let document = await levelConfigModel.findOne({ guildId }).lean().exec();

  if (!document && insert) {
    document = await updateLevelConfig(guildId, {});
  }

  return document as T extends true ? LevelConfigDocument : LevelConfigDocument | null;
}

async function updateLevelConfig(guildId: string, query: UpdateQuery<LevelConfigDocument>): Promise<LevelConfigDocument> {
  const document = await levelConfigModel.findOneAndUpdate({ guildId }, query, { upsert: true, new: true }).lean().exec();

  await updateGuild(guildId, { $set: { level: document._id } });

  return document;
}

export async function enableLevel(guildId: string): Promise<LevelConfigDocument> {
  return updateLevelConfig(guildId, { $set: { enabled: true } });
}

export async function disableLevel(guildId: string): Promise<LevelConfigDocument> {
  return updateLevelConfig(guildId, { $set: { enabled: false } });
}

export async function updateLevelAnnouncement(guildId: string, type: AnnouncementType, channelId?: string): Promise<LevelConfigDocument> {
  return updateLevelConfig(guildId, { $set: { announcement: type, channelId } });
}

export async function addLevelReward(guildId: string, level: number, roleId: string): Promise<LevelConfigDocument> {
  return updateLevelConfig(guildId, { $push: { rewards: { level, roleId } } });
}

export async function removeLevelRewardById(guildId: string, rewardId: Types.ObjectId | string): Promise<LevelConfigDocument> {
  return updateLevelConfig(guildId, { $pull: { rewards: { _id: rewardId } } });
}

export async function addLevelIgnoredRole(guildId: string, roleId: string): Promise<LevelConfigDocument> {
  return updateLevelConfig(guildId, { $push: { ignoredRoles: roleId } });
}

export async function removeLevelIgnoredRole(guildId: string, roleId: string): Promise<LevelConfigDocument> {
  return updateLevelConfig(guildId, { $pull: { ignoredRoles: roleId } });
}

export async function addLevelIgnoredChannel(guildId: string, channelId: string): Promise<LevelConfigDocument> {
  return updateLevelConfig(guildId, { $push: { ignoredChannels: channelId } });
}

export async function removeLevelIgnoredChannel(guildId: string, channelId: string): Promise<LevelConfigDocument> {
  return updateLevelConfig(guildId, { $pull: { ignoredChannels: channelId } });
}

export async function addLevelEnabledChannel(guildId: string, channelId: string): Promise<LevelConfigDocument> {
  return updateLevelConfig(guildId, { $push: { enabledChannels: channelId } });
}

export async function removeLevelEnabledChannel(guildId: string, channelId: string): Promise<LevelConfigDocument> {
  return updateLevelConfig(guildId, { $pull: { enabledChannels: channelId } });
}

/**
 * XP required for a level
 */
const XP_PER_LEVEL = 200;

/**
 * Converts a level to XP
 * @param {number} level
 * @returns {number} Total XP for the level
 */
export function convertLevelToExp(level: number): number {
  return level * XP_PER_LEVEL;
}

/**
 * Converts XP to a level
 * @param {number} xp
 * @returns {number} Level for the XP
 */
export function convertExpToLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL);
}

/**
 * Gets a random amount of XP
 * @returns {number} a number between 5 and 15
 */
export function getRandomExp(): number {
  return getRandomNumber(5, 15);
}

/**
 * Gets the level and XP for a user in a guild
 * @param {string} userId ID of the user to get the level for
 * @param {string} guildId ID of the guild to get the level for
 * @param {boolean} insert Whether to insert the document if it doesn't exist (optional, default: false)
 * @returns {Promise<LevelDocument | null>} Level document or null if not found
 */
export async function getLevel<T extends boolean>(
  userId: string,
  guildId: string,
  insert: T = false as T
): Promise<T extends true ? LevelDocument : LevelDocument | null> {
  let document = await levelModel.findOne({ guildId, userId }).lean().exec();

  if (!document && insert) {
    document = await levelModel.create({ guildId, userId, level: 0, xp: 0 });
  }

  return document as T extends true ? LevelDocument : LevelDocument | null;
}

/**
 * Gets the weekly level and XP for a user in a guild
 * @param {string} userId ID of the user to get the level for
 * @param {string} guildId ID of the guild to get the level for
 * @param {boolean} insert Whether to insert the document if it doesn't exist (optional, default: false)
 * @returns {Promise<WeeklyLevelDocument | null>} Level document or null if not found
 */
export async function getLevelWeekly<T extends boolean>(
  userId: string,
  guildId: string,
  insert: T = false as T
): Promise<T extends true ? WeeklyLevelDocument : WeeklyLevelDocument | null> {
  let document = await weeklyLevelModel.findOne({ guildId, userId }).lean().exec();

  if (!document && insert) {
    document = await weeklyLevelModel.create({ guildId, userId, level: 0, xp: 0 });
  }

  return document as T extends true ? LevelDocument : LevelDocument | null;
}

/**
 * Adds XP to a user in a guild (also updates weekly level)
 * @param {string} userId
 * @param {string} guildId
 * @param {number} xp
 * @returns {Promise<LevelDocument>} Updated level object
 */
export async function appendXP(userId: string, guildId: string, xp: number): Promise<LevelDocument> {
  // Handle weekly level
  const currentWeekly = await getLevelWeekly(userId, guildId, true);
  const weeklyLevel = convertExpToLevel(currentWeekly.xp + xp);
  await weeklyLevelModel
    .findOneAndUpdate({ userId, guildId }, { $inc: { xp }, $set: { level: weeklyLevel } }, { upsert: true, new: true })
    .lean()
    .exec();

  // Handle current level
  const current = await getLevel(userId, guildId, true);
  const level = convertExpToLevel(current.xp + xp);
  return await levelModel
    .findOneAndUpdate({ userId, guildId }, { $inc: { xp }, $set: { level: level } }, { upsert: true, new: true })
    .lean()
    .exec();
}

/**
 * Set the XP of a user in a guild
 * @param {string} userId
 * @param {string} guildId
 * @param {number} xp
 * @returns {Promise<LevelDocument>} Updated level object
 */
export async function setExp(userId: string, guildId: string, xp: number): Promise<LevelDocument> {
  // Verify that the XP is within the allowed range
  if (xp > 200000) xp = 200000;
  if (xp < 0) xp = 0;

  const level = convertExpToLevel(xp);
  return await levelModel.findOneAndUpdate({ userId, guildId }, { $set: { level, xp } }, { upsert: true, new: true }).lean().exec();
}

/**
 * Adds XP to a user in a guild (does not update weekly level)
 * @param {string} userId
 * @param {string} guildId
 * @param {number} xp
 * @returns {Promise<LevelDocument>} Updated level object
 */
export async function addExp(userId: string, guildId: string, xp: number): Promise<LevelDocument> {
  // Verify that the XP is within the allowed range
  if (xp > 200000) xp = 200000;
  if (xp < 0) xp = 0;

  const level = convertExpToLevel(xp);
  return await levelModel.findOneAndUpdate({ userId, guildId }, { $inc: { xp }, $set: { level } }, { upsert: true, new: true }).lean().exec();
}

/**
 * Sets the level of a user in a guild (does not update weekly level)
 * @param {string} userId
 * @param {string} guildId
 * @param {number} level
 * @returns {Promise<LevelDocument>} Updated level object
 */
export async function setLevel(userId: string, guildId: string, level: number): Promise<LevelDocument> {
  // Verify that the level is within the allowed range
  if (level > 1000) level = 1000;
  if (level < 0) level = 0;

  const xp = convertLevelToExp(level);
  return await levelModel.findOneAndUpdate({ userId, guildId }, { $set: { level, xp } }, { upsert: true, new: true }).lean().exec();
}

/**
 * Adds level to a user in a guild (does not update weekly level)
 * @param {string} userId
 * @param {string} guildId
 * @param {number} level
 * @returns {Promise<LevelDocument>} Updated level object
 */
export async function addLevel(userId: string, guildId: string, level: number): Promise<LevelDocument> {
  // Verify that the level is within the allowed range
  if (level > 1000) level = 1000;
  if (level < 0) level = 0;

  const xp = convertLevelToExp(level);
  return await levelModel.findOneAndUpdate({ userId, guildId }, { $inc: { xp }, $set: { level } }, { upsert: true, new: true }).lean().exec();
}

/**
 * Gets the rewards for a level
 * @param {LevelDocument | PositionLevel} level
 * @returns {Promise<LevelReward[]>} Rewards for the level
 */
export async function getRewardsForLevel(level: LevelDocument | PositionLevel): Promise<LevelReward[]> {
  const config = await getLevelConfig(level.guildId, true);

  return config.rewards.filter((rw) => rw.level <= level.level);
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
 * @returns {Promise<LevelDocument[]>} Leaderboard
 */
export async function getLeaderboard(guildId: string): Promise<LevelDocument[]> {
  return await levelModel
    .find({ guildId })
    .sort([['xp', 'descending']])
    .lean()
    .exec();
}

/**
 * Returns the weekly leaderboard for a guild
 * @param {string} guildId
 * @returns {Promise<WeeklyLevelDocument[]>} Leaderboard
 */
export async function getWeeklyLeaderboard(guildId: string): Promise<WeeklyLevelDocument[]> {
  return await weeklyLevelModel
    .find({ guildId })
    .sort([['xp', 'descending']])
    .lean()
    .exec();
}

/**
 * Adds a username to each level in the leaderboard
 * @param {LevelDocument[] | WeeklyLevelDocument[]} leaderboard
 * @param {DiscordClient} client
 * @returns {Promise<PositionLevel[]>} Leaderboard with usernames
 */
export async function computeLeaderboard(leaderboard: (LevelDocument | WeeklyLevelDocument)[], client: DiscordClient): Promise<PositionLevel[]> {
  return leaderboard.map((level, index) => {
    const user = client.users.cache.get(level.userId);
    return {
      ...level,
      position: index + 1,
      username: user?.username,
      displayName: user?.displayName,
      avatar: user?.displayAvatarURL({ forceStatic: true, extension: 'png' })
    };
  });
}

/**
 * Deletes all weekly levels
 * @returns
 */
export async function deleteWeeklyLevels() {
  return await weeklyLevelModel.deleteMany({});
}

/**
 * Gets ALL levels that include a user id from ALL guilds
 * @param {string} userId User ID to get the levels for
 * @returns {Promise<{ levels: LevelDocument[], weeklyLevels: WeeklyLevelDocument[] }>} All levels
 */
export async function getUserLevels(userId: string): Promise<{ levels: LevelDocument[]; weeklyLevels: WeeklyLevelDocument[] }> {
  const levels = await levelModel.find({ userId }).lean().exec();
  const weeklyLevels = await weeklyLevelModel.find({ userId }).lean().exec();

  return {
    levels,
    weeklyLevels
  };
}

/**
 * Gets ALL levels of a guild from ALL users
 * @param {string} guildId The ID of the guild to get the levels for
 * @returns {Promise<{ levels: LevelDocument[], weeklyLevels: WeeklyLevelDocument[] }>} All levels
 */
export async function getGuildLevels(guildId: string): Promise<{ levels: LevelDocument[]; weeklyLevels: WeeklyLevelDocument[] }> {
  const levels = await levelModel.find({ guildId }).lean().exec();
  const weeklyLevels = await weeklyLevelModel.find({ guildId }).lean().exec();

  return {
    levels,
    weeklyLevels
  };
}

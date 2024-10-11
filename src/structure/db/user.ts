import type { UpdateQuery } from 'mongoose';

import { userModel } from 'models/user';

import { getUserInfractions } from 'db/infraction';
import { getUserLevels } from 'db/level';

import { BadgeType, type UserDocument } from 'types/user';

/**
 * Gets the user data for a given user ID
 * @param {string} userId User ID to get the user data for
 * @returns {Promise<UserDocument>} User data
 */
export async function getUser<T extends boolean>(userId: string, insert: T = false as T): Promise<T extends true ? UserDocument : UserDocument | null> {
  let document = await userModel.findOne({ userId });

  if (!document && insert) {
    document = await updateUser(userId, {});
  }

  return document as T extends true ? UserDocument : UserDocument | null;
}

/**
 * Gets ALL data of a user
 * @param {string} userId User ID to get the user data for
 * @returns {Promise<object>} All data
 */
export async function getUserExport(userId: string): Promise<object> {
  const user = await getUser(userId);
  const levels = await getUserLevels(userId);
  const infractions = await getUserInfractions(userId);

  return {
    ...user,
    infractions,
    ...levels
  };
}

export async function updateUser(userId: string, query: UpdateQuery<UserDocument>) {
  return await userModel.findOneAndUpdate({ userId }, query, { upsert: true, new: true });
}

/**
 * Adds a badge to a user
 * @param {string} userId User ID to add the badge to
 * @param {number} badge Badge to add
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function addBadge(userId: string, badge: BadgeType): Promise<UserDocument> {
  return await updateUser(userId, { $push: { badges: { id: badge, receivedAt: Date.now() } } });
}

/**
 * Removes a badge from a user
 * @param {string} userId User ID to remove the badge from
 * @param {number} badge Badge to remove
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function removeBadge(userId: string, badge: BadgeType): Promise<UserDocument> {
  return await updateUser(userId, { $pull: { badges: { id: badge } } });
}

/**
 * Bans a user
 * @param {string} userId User ID to ban
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function banUser(userId: string): Promise<UserDocument> {
  return await updateUser(userId, { $set: { banned: true } });
}

/**
 * Unban a user
 * @param {string} userId User ID to unban
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function unbanUser(userId: string): Promise<UserDocument> {
  return await updateUser(userId, { $set: { banned: false } });
}

/**
 * Gets all banned users
 * @returns {Promise<UserDocument[]>} Banned users
 */
export async function getBannedUsers(): Promise<UserDocument[]> {
  return await userModel.find({ banned: true }).lean().exec();
}

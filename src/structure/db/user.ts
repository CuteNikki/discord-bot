import type { UpdateQuery } from 'mongoose';

import { userModel } from 'models/user';

import { BadgeType, type UserDocument } from 'types/user';

import { supportedLanguages } from 'utils/language';

/**
 * Gets the language for a given user ID
 * @param {string} userId User ID to get the language for
 * @returns {Promise<string>} Language
 */
export async function getUserLanguage(userId: string | null | undefined): Promise<string> {
  // Return default language if no valid userId is provided
  if (!userId) return supportedLanguages[0];

  // Return language from user db
  const userData = await userModel.findOne({ userId }, {}, { upsert: false }).lean().exec();
  return userData?.language ?? supportedLanguages[0];
}

/**
 * Updates the language for a given user ID
 * @param {string} userId User ID to update the language for
 * @param {string} language Language to update the user with
 * @returns {Promise<UserDocument>} Updated user
 */
export async function updateUserLanguage(userId: string, language: string): Promise<UserDocument> {
  // If language is not supported, use the default language
  if (!supportedLanguages.includes(language)) language = supportedLanguages[0];

  // Update the user in db
  return await updateUserData(userId, { $set: { language } });
}

/**
 * Gets the user data for a given user ID
 * @param {string} userId User ID to get the user data for
 * @returns {Promise<UserDocument>} User data
 */
export async function getUserData(userId: string): Promise<UserDocument> {
  return await userModel.findOneAndUpdate({ userId }, {}, { upsert: true, new: true });
}

/**
 * Updates the user data for a given user ID
 * @param {string} userId User ID to update the user data for
 * @param {UpdateQuery<UserDocument>} query Query to update the user data with
 * @returns {Promise<UserDocument>} Updated user data
 */
async function updateUserData(userId: string, query: UpdateQuery<UserDocument>): Promise<UserDocument> {
  return await userModel.findOneAndUpdate({ userId }, query, { upsert: true, new: true });
}

/**
 * Adds a badge to a user
 * @param {string} userId User ID to add the badge to
 * @param {number} badge Badge to add
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function addBadge(userId: string, badge: BadgeType): Promise<UserDocument> {
  return await updateUserData(userId, { $push: { badges: { id: badge, receivedAt: Date.now() } } });
}

/**
 * Removes a badge from a user
 * @param {string} userId User ID to remove the badge from
 * @param {number} badge Badge to remove
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function removeBadge(userId: string, badge: BadgeType): Promise<UserDocument> {
  return await updateUserData(userId, { $pull: { badges: { id: badge } } });
}

/**
 * Bans a user
 * @param {string} userId User ID to ban
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function banUser(userId: string): Promise<UserDocument> {
  return await updateUserData(userId, { $set: { banned: true } });
}

/**
 * Unban a user
 * @param {string} userId User ID to unban
 * @returns {Promise<UserDocument>} Updated user data
 */
export async function unbanUser(userId: string): Promise<UserDocument> {
  return await updateUserData(userId, { $set: { banned: false } });
}

/**
 * Gets all banned users
 * @returns {Promise<UserDocument[]>} Banned users
 */
export async function getBannedUsers(): Promise<UserDocument[]> {
  return await userModel.find({ banned: true }).lean().exec();
}

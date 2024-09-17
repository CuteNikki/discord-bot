import type { UpdateQuery } from 'mongoose';

import { userModel, type UserData } from 'models/user';

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
 * @returns {Promise<UserData>} Updated user
 */
export async function updateUserLanguage(userId: string, language: string): Promise<UserData> {
  // If language is not supported, use the default language
  if (!supportedLanguages.includes(language)) language = supportedLanguages[0];

  // Update the user in db
  return await updateUserData(userId, { $set: { language } });
}

/**
 * Gets the user data for a given user ID
 * @param {string} userId User ID to get the user data for
 * @returns {Promise<UserData>} User data
 */
export async function getUserData(userId: string): Promise<UserData> {
  return await userModel.findOneAndUpdate({ userId }, {}, { upsert: true, new: true });
}

/**
 * Updates the user data for a given user ID
 * @param {string} userId User ID to update the user data for
 * @param {UpdateQuery<UserData>} query Query to update the user data with
 * @returns {Promise<UserData>} Updated user data
 */
export async function updateUserData(userId: string, query: UpdateQuery<UserData>): Promise<UserData> {
  return await userModel.findOneAndUpdate({ userId }, query, { upsert: true, new: true });
}

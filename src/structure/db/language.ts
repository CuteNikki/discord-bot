import { updateGuildSettings } from 'db/guild';
import { updateUserData } from 'db/user';
import { guildModel } from 'models/guild';
import { userModel } from 'models/user';

import type { GuildDocument } from 'types/guild';
import type { UserDocument } from 'types/user';

import { supportedLanguages } from 'utils/language';

/**
 * Gets the language for a given guild ID
 * @param {string} guildId Guild ID to get the language for
 * @returns {Promise<string>} Language
 */
export async function getGuildLanguage(guildId: string | null | undefined): Promise<string> {
  // Return default language if no valid guildId is provided
  if (!guildId) return supportedLanguages[0];

  // Fetch guild from db and return language
  const guild = await guildModel.findOne({ guildId }, {}, { upsert: false }).lean().exec();
  return guild?.language ?? supportedLanguages[0];
}

/**
 * Updates the language for a given guild ID
 * @param {string} guildId Guild ID to update the language for
 * @param {string} language Language to update the guild with
 * @returns {Promise<GuildDocument>} Updated guild
 */
export async function updateGuildLanguage(guildId: string, language: string): Promise<GuildDocument> {
  // If language is not supported, use the default language
  if (!supportedLanguages.includes(language)) language = supportedLanguages[0];

  // Update the guild in db
  return await updateGuildSettings(guildId, { $set: { language } });
}

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

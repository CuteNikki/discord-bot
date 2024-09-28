import type { UpdateQuery } from 'mongoose';

import { guildModel } from 'models/guild';

import type { GuildDocument } from 'types/guild';

import { supportedLanguages } from 'utils/language';

/**
 * Gets or creates the guild settings for a given guild ID
 * @param {string} guildId Guild ID to get the settings for
 * @returns {Promise<GuildDocument>} Guild settings
 */
export async function getGuildSettings(guildId: string): Promise<GuildDocument> {
  return await guildModel.findOneAndUpdate({ guildId }, {}, { upsert: true, new: true }).lean().exec();
}

/**
 * Updates the guild settings for a given guild ID
 * @param {string} guildId Guild ID to update the settings for
 * @param {UpdateQuery<GuildDocument>} query Query to update the settings with
 * @returns {Promise<GuildDocument>} Updated guild settings
 */
export async function updateGuildSettings(guildId: string, query: UpdateQuery<GuildDocument>): Promise<GuildDocument> {
  return await guildModel.findOneAndUpdate({ guildId }, query, { upsert: true, new: true }).lean().exec();
}

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

import type { UpdateQuery } from 'mongoose';

import { guildModel } from 'models/guild';

import type { GuildDocument } from 'types/guild';

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

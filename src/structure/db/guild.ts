import type { PopulateOptions, UpdateQuery } from 'mongoose';

import { getGuildGiveaways } from 'db/giveaway';
import { getGuildInfractions } from 'db/infraction';
import { getGuildLevels } from 'db/level';
import { guildModel } from 'models/guild';

import { DEFAULT_GUILD_POPULATE } from 'constants/populate';

import type { GuildDocument } from 'types/guild';

/**
 * Gets or creates the guild settings for a given guild ID
 * @param {string} guildId ID of the guild to get
 * @param {boolean} insert If true, inserts a new document if none exists (optional, default is false)
 * @param {PopulateOptions[]} populate Modules to populate
 * @returns {Promise<GuildDocument>} Guild settings or null if not found
 */
export async function getGuild<T extends boolean>(
  guildId: string,
  insert: T = false as T,
  populate: PopulateOptions[] = DEFAULT_GUILD_POPULATE
): Promise<T extends true ? GuildDocument : GuildDocument | null> {
  let document = await guildModel.findOne({ guildId }).populate(populate).lean().exec();

  if (insert && !document) {
    document = await updateGuild(guildId, {}, populate);
  }

  return document as T extends true ? GuildDocument : GuildDocument | null;
}

/**
 * Updates guild settings for a given guild ID
 * @param {string} guildId ID of the guild to update
 * @param {UpdateQuery<GuildDocument>} query Update query
 * @param populate Modules to populate
 * @returns {Promise<GuildDocument>} Updates guild settings
 */
export async function updateGuild(
  guildId: string,
  query: UpdateQuery<GuildDocument>,
  populate: PopulateOptions[] = DEFAULT_GUILD_POPULATE
): Promise<GuildDocument> {
  return await guildModel.findOneAndUpdate({ guildId }, query, { upsert: true, new: true }).populate(populate).lean().exec();
}

/**
 * Shows all stored data for a guild
 * @param {string} guildId Guild ID to get the data for
 * @returns {Promise<object>} All data
 */
export async function getGuildExport(guildId: string): Promise<object> {
  const guild = await getGuild(guildId);
  const giveaways = await getGuildGiveaways(guildId);
  const infractions = await getGuildInfractions(guildId);
  const levels = await getGuildLevels(guildId);

  return {
    ...guild,
    giveaways,
    infractions,
    ...levels
  };
}

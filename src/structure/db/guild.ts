import type { UpdateQuery } from 'mongoose';

import { getGuildGiveaways } from 'db/giveaway';
import { getGuildInfractions } from 'db/infraction';
import { getGuildLevels } from 'db/level';
import { guildModel } from 'models/guild';

import type { GuildDocument } from 'types/guild';

const DEFAULT_POPULATE = [
  { path: 'starboard' },
  { path: 'customVoice' },
  { path: 'reactionRoles', populate: { path: 'groups' } },
  { path: 'counting' },
  { path: 'ticket' },
  { path: 'moderation' },
  { path: 'level' },
  { path: 'welcome' },
  { path: 'farewell' }
];

/**
 * Gets or creates the guild settings for a given guild ID
 * @param {string} guildId ID of the guild to get
 * @param populate Modules to populate
 * @returns {Promise<GuildDocument>} Guild settings
 */
export async function getGuild(guildId: string, populate = DEFAULT_POPULATE): Promise<GuildDocument> {
  return await updateGuild(guildId, {}, populate);
}

/**
 * Updates guild settings for a given guild ID
 * @param {string} guildId ID of the guild to update
 * @param {UpdateQuery<GuildDocument>} query Update query
 * @param populate Modules to populate
 * @returns {Promise<GuildDocument>} Updates guild settings
 */
export async function updateGuild(guildId: string, query: UpdateQuery<GuildDocument>, populate = DEFAULT_POPULATE): Promise<GuildDocument> {
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

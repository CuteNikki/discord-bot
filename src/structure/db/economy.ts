import type { UpdateQuery } from 'mongoose';

import { economyModel } from 'models/economy';

import { updateGuild } from 'db/guild';

import type { EconomyDocument } from 'types/economy';

/**
 * Gets or creates the economy settings for a given guild ID
 * @param {string} guildId ID of the guild to get
 * @param {boolean} insert If true, inserts a new document if none exists (optional, default is false)
 * @returns {Promise<EconomyDocument>} Economy settings or null if not found
 */
export async function getEconomy<T extends boolean>(
  guildId: string,
  insert: T = false as T
): Promise<T extends true ? EconomyDocument : EconomyDocument | null> {
  let document = (await economyModel.findOne({ guildId }).lean().exec()) as EconomyDocument;

  if (insert && !document) {
    document = await updateEconomy(guildId, {});
  }

  return document as T extends true ? EconomyDocument : EconomyDocument | null;
}

/**
 * Updates economy settings for a given guild ID
 * @param {string} guildId ID of the guild to update
 * @param {UpdateQuery<EconomyDocument>} query Update query
 * @returns {Promise<EconomyDocument>} Updates economy settings
 */
export async function updateEconomy(guildId: string, query: UpdateQuery<EconomyDocument>): Promise<EconomyDocument> {
  const document = await economyModel.findOneAndUpdate({ guildId }, query, { upsert: true, new: true }).lean().exec();

  await updateGuild(guildId, { $set: { economy: document._id } });

  return document;
}

/**
 * Disables the economy for a given guild ID
 * @param {string} guildId ID of the guild to disable
 * @returns {Promise<EconomyDocument>} Updated economy settings
 */
export async function disableEconomy(guildId: string): Promise<EconomyDocument> {
  return await updateEconomy(guildId, { enabled: false });
}

/**
 * Enables the economy for a given guild ID
 * @param {string} guildId ID of the guild to enable
 * @returns {Promise<EconomyDocument>} Updated economy settings
 */
export async function enableEconomy(guildId: string): Promise<EconomyDocument> {
  return await updateEconomy(guildId, { enabled: true });
}

/**
 * Shows all stored economy data for a guild
 * @param {string} guildId Guild ID to get the data for
 * @returns {Promise<object>} All economy data
 */
export async function getEconomyExport(guildId: string): Promise<object> {
  const economy = await getEconomy(guildId);

  return {
    ...economy
  };
}

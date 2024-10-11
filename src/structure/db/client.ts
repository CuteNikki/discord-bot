import type { UpdateQuery } from 'mongoose';

import { clientModel } from 'models/client';

import type { ClientDocument } from 'types/client';

/**
 * Gets the client settings for a given application ID
 * @param {string} applicationId Application ID to get the client settings for
 * @param {boolean} insert If true, inserts a new document if none exists (optional, default is false)
 * @returns {Promise<ClientDocument>} Client settings
 */
export async function getClientSettings<T extends boolean>(
  applicationId: string,
  insert: T = false as T
): Promise<T extends true ? ClientDocument : ClientDocument | null> {
  let document = await clientModel.findOne({ applicationId }).lean().exec();
  if (insert && !document) {
    document = await updateClientSettings(applicationId);
  }
  return document as T extends true ? ClientDocument : ClientDocument | null;
}

/**
 * Updates the client settings for a given application ID
 * @param {string} applicationId Application ID to update the client settings for
 * @param {UpdateQuery<ClientDocument>} query Query to update the client settings with
 * @returns {Promise<ClientDocument>} Updated client settings
 */
async function updateClientSettings(applicationId: string, query: UpdateQuery<ClientDocument> = {}): Promise<ClientDocument> {
  return await clientModel.findOneAndUpdate({ applicationId }, query, { upsert: true, new: true }).lean().exec();
}

/**
 * Updates the last weekly clear date for a given application ID
 * @param {string} applicationId Application ID to update
 * @param {number} date The new date
 * @returns {Promise<ClientDocument>} Updated client settings
 */
export async function updateLastWeeklyClearAt(applicationId: string, date: number): Promise<ClientDocument> {
  return await updateClientSettings(applicationId, { $set: { ['database.lastWeeklyClearAt']: date } });
}

/**
 * Updates the support guild ID for a given application ID
 * @param {string} applicationId Application ID to update
 * @param {string} guildId The new guild ID
 * @returns {Promise<ClientDocument>} Updated client settings
 */
export async function updateSupportGuildId(applicationId: string, guildId: string): Promise<ClientDocument> {
  return await updateClientSettings(applicationId, { $set: { ['support.guildId']: guildId } });
}

/**
 * Removes the support guild ID for a given application ID
 * @param {string} applicationId Application ID to update
 * @returns {Promise<ClientDocument>} Updated client settings
 */
export async function removeSupportGuildId(applicationId: string): Promise<ClientDocument> {
  return await updateClientSettings(applicationId, { $set: { ['support.guildId']: null } });
}

/**
 * Updates the support guild invite for a given application ID
 * @param {string} applicationId Application ID to update
 * @param {string} guildInvite The new guild invite
 * @returns {Promise<ClientDocument>} Updated client settings
 */
export async function updateSupportGuildInvite(applicationId: string, guildInvite: string): Promise<ClientDocument> {
  return await updateClientSettings(applicationId, { $set: { ['support.guildInvite']: guildInvite } });
}

/**
 * Removes the support guild invite for a given application ID
 * @param {string} applicationId Application ID to update
 * @returns {Promise<ClientDocument>} Updated client settings
 */
export async function removeSupportGuildInvite(applicationId: string): Promise<ClientDocument> {
  return await updateClientSettings(applicationId, { $set: { ['support.guildInvite']: null } });
}

/**
 * Updates the support bot invite for a given application ID
 * @param {string} applicationId Application ID to update
 * @param {string} botInvite The new bot invite
 * @returns {Promise<ClientDocument>} Updated client settings
 */
export async function updateSupportBotInvite(applicationId: string, botInvite: string): Promise<ClientDocument> {
  return await updateClientSettings(applicationId, { $set: { ['support.botInvite']: botInvite } });
}

/**
 * Removes the support bot invite for a given application ID
 * @param {string} applicationId Application ID to update
 * @returns {Promise<ClientDocument>} Updated client settings
 */
export async function removeSupportBotInvite(applicationId: string): Promise<ClientDocument> {
  return await updateClientSettings(applicationId, { $set: { ['support.botInvite']: null } });
}

/**
 * Increments the commands executed count for a given application ID
 * @param {string} applicationId Application ID to increment the commands executed count for
 * @returns {Promise<ClientDocument>} Updated client settings
 */
export async function incrementCommandsExecuted(applicationId: string): Promise<ClientDocument> {
  return await updateClientSettings(applicationId, { $inc: { ['stats.commandsExecuted']: 1 } });
}

/**
 * Increments the commands failed count for a given application ID
 * @param {string} applicationId Application ID to increment the commands failed count for
 * @returns {Promise<ClientDocument>} Updated client settings
 */
export async function incrementCommandsFailed(applicationId: string): Promise<ClientDocument> {
  return await updateClientSettings(applicationId, { $inc: { ['stats.commandsFailed']: 1 } });
}

/**
 * Increments the buttons executed count for a given application ID
 * @param {string} applicationId Application ID to increment the buttons executed count for
 * @returns {Promise<ClientDocument>} Updated client settings
 */
export async function incrementButtonsExecuted(applicationId: string): Promise<ClientDocument> {
  return await updateClientSettings(applicationId, { $inc: { ['stats.buttonsExecuted']: 1 } });
}

/**
 * Increments the buttons failed count for a given application ID
 * @param {string} applicationId Application ID to increment the buttons failed count for
 * @returns {Promise<ClientDocument>} Updated client settings
 */
export async function incrementButtonsFailed(applicationId: string): Promise<ClientDocument> {
  return await updateClientSettings(applicationId, { $inc: { ['stats.buttonsFailed']: 1 } });
}

/**
 * Increments the guilds joined count for a given application ID
 * @param {string} applicationId Application ID to increment the guilds joined count for
 * @returns {Promise<ClientDocument>} Updated client settings
 */
export async function incrementGuildsJoined(applicationId: string): Promise<ClientDocument> {
  return await updateClientSettings(applicationId, { $inc: { ['stats.guildsJoined']: 1 } });
}

/**
 * Increments the guilds left count for a given application ID
 * @param {string} applicationId Application ID to increment the guilds left count for
 * @returns {Promise<ClientDocument>} Updated client settings
 */
export async function incrementGuildsLeft(applicationId: string): Promise<ClientDocument> {
  return await updateClientSettings(applicationId, { $inc: { ['stats.guildsLeft']: 1 } });
}

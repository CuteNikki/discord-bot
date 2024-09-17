import type { UpdateQuery } from 'mongoose';

import { clientModel, type ClientSettings } from 'models/client';

/**
 * Gets the client settings for a given application ID
 * @param {string} applicationId Application ID to get the client settings for
 * @returns {Promise<ClientSettings>} Client settings
 */
export async function getClientSettings(applicationId: string): Promise<ClientSettings> {
  return await clientModel.findOneAndUpdate({ applicationId }, {}, { upsert: true, new: true }).lean().exec();
}

/**
 * Updates the client settings for a given application ID
 * @param {string} applicationId Application ID to update the client settings for
 * @param {UpdateQuery<ClientSettings>} query Query to update the client settings with
 * @returns {Promise<ClientSettings>} Updated client settings
 */
export async function updateClientSettings(applicationId: string, query: UpdateQuery<ClientSettings>): Promise<ClientSettings> {
  return await clientModel.findOneAndUpdate({ applicationId }, query, { upsert: true, new: true }).lean().exec();
}

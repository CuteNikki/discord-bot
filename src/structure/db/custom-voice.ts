import type { UpdateQuery } from 'mongoose';

import { customVoiceModel } from 'models/custom-voice';

import type { CustomVoiceDocument } from 'types/custom-voice';

/**
 * Gets the custom voice config
 * @param {string} guildId Guild ID to get the custom voice for
 * @returns {Promise<CustomVoiceDocument | null>} Custom voice config data or null if not found
 */
export async function getCustomVoice(guildId: string): Promise<CustomVoiceDocument | null> {
  return await customVoiceModel.findOne({ guildId }, {}, { upsert: false }).lean().exec();
}

/**
 * Updates a custom voice config
 * @param {string} guildId Guild ID to update
 * @param {UpdateQuery<CustomVoiceDocument>} query Query to update the custom voice config with
 * @returns {Promise<CustomVoiceDocument>} Updated custom voice config
 */
async function updateCustomVoice(guildId: string, query: UpdateQuery<CustomVoiceDocument>): Promise<CustomVoiceDocument> {
  return await customVoiceModel.findOneAndUpdate({ guildId }, query, { upsert: true, new: true }).lean().exec();
}

/**
 * Creates a custom voice config
 * @param {string} guildId Guild ID to create the custom voice config for
 * @param {string} channelId Channel ID where custom voice channels will be created in
 * @param {string} parentId Parent/Category ID that holds the custom voice channels
 * @returns {Promise<CustomVoiceDocument>} Created custom voice config
 */
export async function createCustomVoice(guildId: string, channelId: string, parentId: string): Promise<CustomVoiceDocument> {
  return await updateCustomVoice(guildId, { $set: { channelId, parentId } });
}

/**
 * Sets the custom voice channel
 * @param {string} guildId Guild ID to set the custom voice config for
 * @param {string} channelId Channel ID where custom voice channels will be created in
 * @returns {Promise<CustomVoiceDocument>} Updated custom voice config
 */
export async function setCustomVoiceChannel(guildId: string, channelId: string | null): Promise<CustomVoiceDocument> {
  return await updateCustomVoice(guildId, { $set: { channelId } });
}

/**
 * Sets the custom voice parent
 * @param {string} guildId Guild ID to set the custom voice config for
 * @param {string} parentId Parent/Category ID that holds the custom voice channels
 * @returns {Promise<CustomVoiceDocument>} Updated custom voice config
 */
export async function setCustomVoiceParent(guildId: string, parentId: string | null): Promise<CustomVoiceDocument> {
  return await updateCustomVoice(guildId, { $set: { parentId } });
}

/**
 * Deletes a custom voice config
 * @param {string} guildId Guild ID to delete the custom voice config for
 * @returns {Promise<CustomVoiceDocument | null>} Deleted custom voice config or null if not found
 */
export async function deleteCustomVoice(guildId: string): Promise<CustomVoiceDocument | null> {
  return await customVoiceModel.findOneAndDelete({ guildId }, { upsert: false }).lean().exec();
}

/**
 * Enables the custom voice config
 * @param {string} guildId Guild ID to enable the custom voice config for
 * @returns {Promise<CustomVoiceDocument>} Updated custom voice config
 */
export async function enableCustomVoice(guildId: string): Promise<CustomVoiceDocument> {
  return await updateCustomVoice(guildId, { $set: { enabled: true } });
}

/**
 * Disables the custom voice config
 * @param {string} guildId Guild ID to disable the custom voice config for
 * @returns {Promise<CustomVoiceDocument>} Updated custom voice config
 */
export async function disableCustomVoice(guildId: string): Promise<CustomVoiceDocument> {
  return await updateCustomVoice(guildId, { $set: { enabled: false } });
}

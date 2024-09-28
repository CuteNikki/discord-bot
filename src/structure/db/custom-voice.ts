import type { UpdateQuery } from 'mongoose';

import { customVoiceModel } from 'models/customVoiceChannels';

import type { CustomVoiceDocument } from 'types/custom-voice';

/**
 * Gets the custom voice channel data for a given channel ID
 * @param {string} channelId Channel ID to get the custom voice channel data for
 * @returns {Promise<CustomVoiceDocument | null>} Custom voice channel data or null if not found
 */
export async function getCustomVoiceChannel(channelId: string): Promise<CustomVoiceDocument | null> {
  return await customVoiceModel.findOne({ channelId }, {}, { upsert: false }).lean().exec();
}

/**
 * Gets the custom voice channel data for a given owner ID
 * @param {string} ownerId Owner ID to get the custom voice channel data for
 * @returns {Promise<CustomVoiceDocument | null>} Custom voice channel or null if not found
 */
export async function getCustomVoiceChannelByOwner(ownerId: string): Promise<CustomVoiceDocument | null> {
  return await customVoiceModel.findOne({ ownerId }, {}, { upsert: false }).lean().exec();
}

/**
 * Gets all custom voice channels
 * @returns {Promise<CustomVoiceDocument[]>} An array of custom voice channel data
 */
export async function getCustomVoiceChannels(): Promise<CustomVoiceDocument[]> {
  return await customVoiceModel.find().lean().exec();
}

/**
 * Gets all custom voice channels that belong to a given guild
 * @param {string} guildId Guild ID to get the custom voice channels for
 * @returns {Promise<CustomVoiceDocument[]>} An array of custom voice channel data
 */
export async function getCustomVoiceChannelsByGuild(guildId: string): Promise<CustomVoiceDocument[]> {
  return await customVoiceModel.find({ guildId }).lean().exec();
}

/**
 * Updates a custom voice channel
 * @param {string} channelId Channel ID to update
 * @param {UpdateQuery<CustomVoiceDocument>} query Query to update the custom voice channel with
 * @returns {Promise<CustomVoiceDocument>} Updated custom voice channel
 */
export async function updateCustomVoiceChannel(channelId: string, query: UpdateQuery<CustomVoiceDocument>): Promise<CustomVoiceDocument> {
  return await customVoiceModel.findOneAndUpdate({ channelId }, query, { upsert: true, new: true }).lean().exec();
}

/**
 * Deletes a custom voice channel
 * @param {string} channelId Channel ID to delete
 * @returns {Promise<CustomVoiceDocument | null>} Deleted custom voice channel or null if not found
 */
export async function deleteCustomVoiceChannel(channelId: string): Promise<CustomVoiceDocument | null> {
  return await customVoiceModel.findOneAndDelete({ channelId }, { upsert: false }).lean().exec();
}

/**
 * Create a new custom voice channel
 * @param {string} channelId Channel ID to create the custom voice channel for
 * @param {string} guildId Guild ID to create the custom voice channel for
 * @param {string} ownerId Owner ID to create the custom voice channel for
 * @returns {Promise<CustomVoiceDocument>} Created custom voice channel
 */
export async function createCustomVoiceChannel(channelId: string, guildId: string, ownerId: string): Promise<CustomVoiceDocument> {
  return await customVoiceModel.findOneAndUpdate({ channelId }, { $set: { ownerId, guildId } }, { upsert: true, new: true }).lean().exec();
}

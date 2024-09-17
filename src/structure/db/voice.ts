import type { UpdateQuery } from 'mongoose';

import { customVoiceChannelModel, type CustomVoiceChannel } from 'models/customVoiceChannels';

/**
 * Gets the custom voice channel data for a given channel ID
 * @param {string} channelId Channel ID to get the custom voice channel data for
 * @returns {Promise<CustomVoiceChannel | null>} CustomVoiceChannel data or null if not found
 */
export async function getCustomVoiceChannel(channelId: string): Promise<CustomVoiceChannel | null> {
  return await customVoiceChannelModel.findOne({ channelId }, {}, { upsert: false }).lean().exec();
}

/**
 * Gets the custom voice channel data for a given owner ID
 * @param {string} ownerId Owner ID to get the custom voice channel data for
 * @returns {Promise<CustomVoiceChannel | null>} CustomVoiceChannel or null if not found
 */
export async function getCustomVoiceChannelByOwner(ownerId: string): Promise<CustomVoiceChannel | null> {
  return await customVoiceChannelModel.findOne({ ownerId }, {}, { upsert: false }).lean().exec();
}

/**
 * Gets all custom voice channels
 * @returns {Promise<CustomVoiceChannel[]>} An array of CustomVoiceChannel data
 */
export async function getCustomVoiceChannels(): Promise<CustomVoiceChannel[]> {
  return await customVoiceChannelModel.find().lean().exec();
}

/**
 * Gets all custom voice channels that belong to a given guild
 * @param {string} guildId Guild ID to get the custom voice channels for
 * @returns {Promise<CustomVoiceChannel[]>} An array of CustomVoiceChannel data
 */
export async function getCustomVoiceChannelsByGuild(guildId: string): Promise<CustomVoiceChannel[]> {
  return await customVoiceChannelModel.find({ guildId }).lean().exec();
}

/**
 * Updates a custom voice channel
 * @param {string} channelId Channel ID to update
 * @param {UpdateQuery<CustomVoiceChannel>} query Query to update the custom voice channel with
 * @returns {Promise<CustomVoiceChannel>} updated CustomVoiceChannel
 */
export async function updateCustomVoiceChannel(channelId: string, query: UpdateQuery<CustomVoiceChannel>): Promise<CustomVoiceChannel> {
  return await customVoiceChannelModel.findOneAndUpdate({ channelId }, query, { upsert: true, new: true }).lean().exec();
}

/**
 * Deletes a custom voice channel
 * @param {string} channelId Channel ID to delete
 * @returns {Promise<CustomVoiceChannel | null>} Deleted CustomVoiceChannel or null if not found
 */
export async function deleteCustomVoiceChannel(channelId: string): Promise<CustomVoiceChannel | null> {
  return await customVoiceChannelModel.findOneAndDelete({ channelId }, { upsert: false }).lean().exec();
}

/**
 * Create a new custom voice channel
 * @param {string} channelId Channel ID to create the custom voice channel for
 * @param {string} guildId Guild ID to create the custom voice channel for
 * @param {string} ownerId Owner ID to create the custom voice channel for
 * @returns {Promise<CustomVoiceChannel>} Created CustomVoiceChannel
 */
export async function createCustomVoiceChannel(channelId: string, guildId: string, ownerId: string): Promise<CustomVoiceChannel> {
  return await customVoiceChannelModel.findOneAndUpdate({ channelId }, { $set: { ownerId, guildId } }, { upsert: true, new: true }).lean().exec();
}

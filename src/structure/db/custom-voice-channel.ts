import type { UpdateQuery } from 'mongoose';

import { customVoiceChannelModel } from 'models/custom-voice-channel';

import type { CustomVoiceChannelDocument } from 'types/custom-voice-channel';

/**
 * Gets the custom voice channel data for a given channel ID
 * @param {string} channelId Channel ID to get the custom voice channel data for
 * @param {boolean} insert If true, inserts a new document if none exists (optional, default is false)
 * @returns {Promise<CustomVoiceChannelDocument | null>} Custom voice channel data or null if not found
 */
export async function getCustomVoiceChannel<T extends boolean>(
  channelId: string,
  insert: T = false as T
): Promise<T extends true ? CustomVoiceChannelDocument : CustomVoiceChannelDocument | null> {
  let document = await customVoiceChannelModel.findOne({ channelId }).lean().exec();

  if (insert && !document) {
    document = await updateCustomVoiceChannel(channelId, {});
  }

  return document as T extends true ? CustomVoiceChannelDocument : CustomVoiceChannelDocument | null;
}

/**
 * Updates a custom voice channel
 * @param {string} channelId Channel ID to update
 * @param {UpdateQuery<CustomVoiceChannelDocument>} query Query to update the custom voice channel with
 * @returns {Promise<CustomVoiceChannelDocument>} Updated custom voice channel
 */
export async function updateCustomVoiceChannel(channelId: string, query: UpdateQuery<CustomVoiceChannelDocument>): Promise<CustomVoiceChannelDocument> {
  return await customVoiceChannelModel.findOneAndUpdate({ channelId }, query, { upsert: true, new: true }).lean().exec();
}

/**
 * Gets the custom voice channel data for a given owner ID
 * @param {string} ownerId Owner ID to get the custom voice channel data for
 * @returns {Promise<CustomVoiceChannelDocument | null>} Custom voice channel or null if not found
 */
export async function getCustomVoiceChannelByOwner(ownerId: string): Promise<CustomVoiceChannelDocument | null> {
  return await customVoiceChannelModel.findOne({ ownerId }).lean().exec();
}

/**
 * Gets all custom voice channels
 * @returns {Promise<CustomVoiceChannelDocument[]>} An array of custom voice channel data
 */
export async function getCustomVoiceChannels(): Promise<CustomVoiceChannelDocument[]> {
  return await customVoiceChannelModel.find().lean().exec();
}

/**
 * Gets all custom voice channels that belong to a given guild
 * @param {string} guildId Guild ID to get the custom voice channels for
 * @returns {Promise<CustomVoiceChannelDocument[]>} An array of custom voice channel data
 */
export async function getCustomVoiceChannelsByGuild(guildId: string): Promise<CustomVoiceChannelDocument[]> {
  return await customVoiceChannelModel.find({ guildId }).lean().exec();
}

/**
 * Deletes a custom voice channel
 * @param {string} channelId Channel ID to delete
 * @returns {Promise<CustomVoiceChannelDocument | null>} Deleted custom voice channel or null if not found
 */
export async function deleteCustomVoiceChannel(channelId: string): Promise<CustomVoiceChannelDocument | null> {
  return await customVoiceChannelModel.findOneAndDelete({ channelId }).lean().exec();
}

/**
 * Create a new custom voice channel
 * @param {string} channelId Channel ID to create the custom voice channel for
 * @param {string} guildId Guild ID to create the custom voice channel for
 * @param {string} ownerId Owner ID to create the custom voice channel for
 * @returns {Promise<CustomVoiceChannelDocument>} Created custom voice channel
 */
export async function createCustomVoiceChannel(channelId: string, guildId: string, ownerId: string): Promise<CustomVoiceChannelDocument> {
  return await updateCustomVoiceChannel(channelId, { channelId, guildId, ownerId });
}

/**
 * Set the owner of a custom voice channel
 * @param {string} channelId Channel ID to set the owner for
 * @param {string} ownerId Owner ID to set
 * @returns {Promise<CustomVoiceChannelDocument>} Updated custom voice channel
 */
export async function setCustomVoiceOwner(channelId: string, ownerId: string): Promise<CustomVoiceChannelDocument> {
  return await updateCustomVoiceChannel(channelId, { ownerId });
}

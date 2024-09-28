import type { Types } from 'mongoose';

import { availableChannelModel, connectionModel } from 'models/phone';
import type { AvailableChannelDocument, ConnectionDocument } from 'types/phone';

/**
 * Gets all available channels
 * @param {string} channelId So we don't connect to our own channel
 * @param {string} userId So we don't connect to ourselves
 * @returns {Promise<AvailableChannelDocument[]>} All available channels excluding the passed channel/user
 */
export async function getAvailableChannels(channelId: string, userId: string): Promise<AvailableChannelDocument[]> {
  return await availableChannelModel
    .find({ channelId: { $ne: channelId }, userId: { $ne: userId } })
    .lean()
    .exec();
}

/**
 * Adds a channel to the available channels
 * @param {string} channelId The current channel
 * @param {string} userId The user that adds the channel
 * @returns {Promise<AvailableChannelDocument>} The db response
 */
export async function addAvailableChannel(channelId: string, userId: string): Promise<AvailableChannelDocument> {
  return await availableChannelModel.create({ channelId, userId });
}

/**
 * Removes a channel from the available channels
 * @param {string} channelId The channel to remove
 * @returns The db response
 */
export async function removeAvailableChannel(channelId: string) {
  return await availableChannelModel.deleteOne({ channelId });
}

/**
 * Removes a channel from the available channels by _id
 * @param {Types.ObjectId} _id The id of the channel object to remove
 * @returns {Promise<AvailableChannel | null>} The deleted channel or null if it was not found
 */
export async function removeAvailableChannelById(_id: Types.ObjectId): Promise<AvailableChannelDocument | null> {
  return await availableChannelModel.findByIdAndDelete(_id);
}

/**
 * Finds a channel in the available channels
 * @param {string} channelId The channel to find
 * @returns {Promise<AvailableChannel | null>} The found channel or null if it was not found
 */
export async function findAvailableChannel(channelId: string): Promise<AvailableChannelDocument | null> {
  return await availableChannelModel.findOne({ channelId });
}

/**
 * Find a phone connection
 * @param {string} channelId The channel to find
 * @returns
 */
export async function findConnection(channelId: string) {
  return await connectionModel
    .findOne({
      $or: [{ channelIdOne: channelId }, { channelIdTwo: channelId }],
    })
    .lean()
    .exec();
}

/**
 * Find a connection by id
 * @param {Types.ObjectId} _id The id of the connection object to find
 * @returns {Promise<Connection | null>} The found connection or null if it was not found
 */
export async function findConnectionById(_id: Types.ObjectId): Promise<ConnectionDocument | null> {
  return await connectionModel.findById(_id);
}

/**
 * Creates a connection between two channels
 * @param {string} channelIdOne
 * @param {string} userIdOne
 * @param {string} channelIdTwo
 * @param {string} userIdTwo
 * @returns {Promise<ConnectionDocument>} The connection object
 */
export async function createConnection(channelIdOne: string, userIdOne: string, channelIdTwo: string, userIdTwo: string): Promise<ConnectionDocument> {
  return await connectionModel.create({
    channelIdOne,
    userIdOne,
    channelIdTwo,
    userIdTwo,
  });
}

/**
 * Deletes a connection
 * @param {Types.ObjectId} _id The id of the connection object to delete
 * @returns {Promise<Connection | null>} The deleted connection or null if it was not found
 */
export async function deleteConnectionById(_id: Types.ObjectId): Promise<ConnectionDocument | null> {
  return await connectionModel.findByIdAndDelete(_id);
}

/**
 * Checks if a channel is already connected to a phone
 * @param {string} channelId Channel ID to check
 * @returns {Promise<boolean>} True if the channel is already connected, false otherwise
 */
export async function isPhoneConnected(channelId: string): Promise<boolean> {
  const connection = await connectionModel
    .findOne({ $or: [{ channelIdOne: channelId }, { channelIdTwo: channelId }] })
    .lean()
    .exec();
  if (connection) return true;
  return false;
}

/**
 * Checks if a channel is already searching for a connection
 * @param {string} channelId Channel ID to check
 * @returns {Promise<boolean>} True if the channel is already searching, false otherwise
 */
export async function isPhoneSearching(channelId: string): Promise<boolean> {
  const channel = await availableChannelModel.findOne({ channelId }).lean().exec();
  if (channel) return true;
  return false;
}

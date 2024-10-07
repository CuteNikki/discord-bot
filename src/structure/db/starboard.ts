import { starboardMessageModel, starboardModel } from 'models/starboard';
import type { Types, UpdateQuery } from 'mongoose';

import type { StarboardDocument, StarboardMessageDocument } from 'types/starboard';

/**
 * Gets the starboard for a guild
 * @param {string} guildId ID of guild to get starboard for
 * @returns {Promise<StarboardDocument | null>} The starboard or null
 */
export async function getStarboard(guildId: string): Promise<StarboardDocument | null> {
  return await starboardModel.findOne({ guildId }).populate('messages').lean().exec();
}

/**
 * Enables the starboard for a guild
 * @param {string} guildId ID of guild to enable starboard for
 * @returns {Promise<StarboardDocument>} Updated Starboard
 */
export async function enableStarboard(guildId: string): Promise<StarboardDocument> {
  return await starboardModel
    .findOneAndUpdate({ guildId }, { $set: { enabled: true } }, { new: true, upsert: true })
    .lean()
    .exec();
}

/**
 * Disables the starboard for a guild
 * @param {string} guildId ID of guild to disable starboard for
 * @returns {Promise<StarboardDocument>} Updated Starboard
 */
export async function disableStarboard(guildId: string): Promise<StarboardDocument> {
  return await starboardModel
    .findOneAndUpdate({ guildId }, { $set: { enabled: false } }, { new: true, upsert: true })
    .lean()
    .exec();
}

/**
 * Sets up the starboard for a guild
 * @param {string} guildId ID of guild to setup starboard for
 * @param {string | undefined} channelId Channel ID to set up starboard for
 * @param {number} minimumStars Minimum stars to set up starboard for
 * @returns {Promise<StarboardDocument>} Updated Starboard
 */
export async function setupStarboard(guildId: string, channelId: string | undefined, minimumStars: number = 1): Promise<StarboardDocument> {
  await starboardMessageModel.deleteMany({ guildId });

  return await starboardModel
    .findOneAndUpdate({ guildId }, { $set: { channelId, minimumStars, enabled: true } }, { new: true, upsert: true })
    .lean()
    .exec();
}

/**
 * Deletes the starboard for a guild
 * @param {string} guildId ID of guild to delete starboard for
 * @returns {Promise<StarboardDocument | null>} Starboard if deleted or null
 */
export async function deleteStarboard(guildId: string): Promise<StarboardDocument | null> {
  await starboardMessageModel.deleteMany({ guildId });

  return await starboardModel.findOneAndDelete({ guildId }).lean().exec();
}

/**
 * Adds a starboard message
 * @param {string} guildId ID of guild to add on
 * @param {string} messageId Message ID to add
 * @param {string[]} reactedUsers Users that reacted to the message
 * @returns {Promise<StarboardMessageDocument>} Created starboard message
 */
export async function addStarboardMessage(guildId: string, messageId: string, reactedUsers: string[]): Promise<StarboardMessageDocument> {
  const starboardMessage = await starboardMessageModel.create({ guildId, messageId, reactedUsers });

  await starboardModel
    .updateOne({ guildId }, { $push: { messages: starboardMessage._id } }, { new: true })
    .lean()
    .exec();

  return starboardMessage;
}

/**
 * Removes a starboard message
 * @param {string} guildId ID of guild to remove on
 * @param {Types.ObjectId | string} _id Message ID to remove
 * @returns Deleted starboard message
 */
export async function removeStarboardMessage(guildId: string, _id: Types.ObjectId | string) {
  const starboardMessage = await starboardMessageModel.deleteOne({ _id });

  await starboardModel
    .findOneAndUpdate({ guildId }, { $pull: { messages: { _id } } }, { new: true, upsert: true })
    .lean()
    .exec();

  return starboardMessage;
}

/**
 * Adds a reacted user to a starboard message
 * @param {Types.ObjectId | string} _id ID of the starboard message
 * @param {string} userId User ID to add
 * @returns {Promise<StarboardMessageDocument | null>} Updated starboard message
 */
export async function addReactedUser(_id: Types.ObjectId | string, userId: string): Promise<StarboardMessageDocument | null> {
  return await starboardMessageModel
    .findOneAndUpdate({ _id }, { $push: { reactedUsers: userId } }, { new: true })
    .lean()
    .exec();
}

/**
 * Removes a reacted user from a starboard message
 * @param {Types.ObjectId | string} _id
 * @param {string} userId
 * @returns {Promise<StarboardMessageDocument | null>} Updated starboard message
 */
export async function removeReactedUser(_id: Types.ObjectId | string, userId: string): Promise<StarboardMessageDocument | null> {
  return await starboardMessageModel
    .findOneAndUpdate({ _id }, { $pull: { reactedUsers: userId } }, { new: true })
    .lean()
    .exec();
}

/**
 * Updates a starboard message
 * @param {Types.ObjectId | string} _id ID of the starboard message
 * @param {UpdateQuery<StarboardMessageDocument>} query Query to update the starboard message with
 * @returns {Promise<StarboardMessageDocument | null>} Updated starboard message
 */
export async function updateStarboardMessage(
  _id: Types.ObjectId | string,
  query: UpdateQuery<StarboardMessageDocument>
): Promise<StarboardMessageDocument | null> {
  return await starboardMessageModel.findOneAndUpdate({ _id }, query, { new: true }).lean().exec();
}

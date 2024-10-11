import type { Types } from 'mongoose';

import { infractionModel } from 'models/infraction';

import type { InfractionDocument } from 'types/infraction';

/**
 * Creates an infraction
 * @param {string} guildId Guild ID to create the infraction for
 * @param {string} userId User ID to create the infraction for
 * @param {string} staffId Staff ID to create the infraction for
 * @param {number} action Action to create the infraction for
 * @param {boolean} closed Whether the infraction is closed or not
 * @param {string} reason Reason for the infraction
 * @param {number} endsAt When the infraction ends
 * @param {number} createdAt When the infraction was created
 * @returns {Promise<InfractionDocument>} Created infraction
 */
export async function createInfraction(
  guildId: string,
  userId: string,
  staffId: string,
  action: number,
  reason?: string,
  endsAt?: number,
  createdAt?: number,
  closed?: boolean
): Promise<InfractionDocument> {
  return await infractionModel.create({
    guildId,
    userId,
    staffId,
    action,
    reason,
    endsAt,
    closed,
    createdAt
  });
}

/**
 * Gets all infractions of a user
 * @param {string} guildId Guild ID to get the infractions for
 * @param {string} userId User ID to get the infractions for
 * @returns {Promise<InfractionDocument[]>} Infractions of the user
 */
export async function getInfractions(guildId: string, userId: string): Promise<InfractionDocument[]> {
  return await infractionModel.find({ guildId, userId }).lean().exec();
}

/**
 * Find infraction by ID
 * @param {string} infractionId Infraction ID to find
 * @returns {Promise<InfractionDocument | null>} Infraction or null if not found
 */
export async function getInfractionById(infractionId: Types.ObjectId | string): Promise<InfractionDocument | null> {
  return await infractionModel.findById(infractionId).lean().exec();
}

/**
 * Deletes an infraction
 * @param {string} infractionId Infraction ID to delete
 * @returns {Promise<InfractionDocument | null>} Deleted infraction or null if not found
 */
export async function deleteInfractionById(infractionId: Types.ObjectId | string): Promise<InfractionDocument | null> {
  return await infractionModel.findByIdAndDelete(infractionId).lean().exec();
}

/**
 * Closes an infraction
 * @param {string} infractionId Infraction ID to close
 * @returns {Promise<InfractionDocument | null>} Closed infraction or null if not found
 */
export async function closeInfractionById(infractionId: Types.ObjectId | string): Promise<InfractionDocument | null> {
  return await infractionModel
    .findByIdAndUpdate(infractionId, { $set: { closed: true } })
    .lean()
    .exec();
}

/**
 * Gets all infractions that are not closed but endsAt is in the past
 * @returns {Promise<InfractionDocument[]>} Infractions
 */
export async function getUnresolvedInfractions(): Promise<InfractionDocument[]> {
  return await infractionModel
    .find({ closed: false, endsAt: { $lte: Date.now() } })
    .lean()
    .exec();
}

/**
 * Gets ALL infractions of a user from ALL guilds
 * @param {string} userId The ID of the user to get the infractions for
 * @returns {Promise<InfractionDocument[]>} Infractions
 */
export async function getUserInfractions(userId: string): Promise<InfractionDocument[]> {
  return await infractionModel.find({ userId }).lean().exec();
}

/**
 * Gets ALL infractions of a guild from ALL users
 * @param {string} guildId The ID of the guild to get the infractions for
 * @returns {Promise<InfractionDocument[]>} Infractions
 */
export async function getGuildInfractions(guildId: string): Promise<InfractionDocument[]> {
  return await infractionModel.find({ guildId }).lean().exec();
}

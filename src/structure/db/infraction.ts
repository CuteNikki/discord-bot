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
  closed?: boolean,
): Promise<InfractionDocument> {
  return await infractionModel.create({
    guildId,
    userId,
    staffId,
    action,
    reason,
    endsAt,
    closed,
    createdAt,
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
export async function findInfraction(infractionId: Types.ObjectId | string): Promise<InfractionDocument | null> {
  return await infractionModel.findById(infractionId).lean().exec();
}

/**
 * Deletes an infraction
 * @param {string} infractionId Infraction ID to delete
 * @returns {Promise<InfractionDocument | null>} Deleted infraction or null if not found
 */
export async function deleteInfraction(infractionId: Types.ObjectId | string): Promise<InfractionDocument | null> {
  return await infractionModel.findByIdAndDelete(infractionId).lean().exec();
}

/**
 * Closes an infraction
 * @param {string} infractionId Infraction ID to close
 * @returns {Promise<InfractionDocument | null>} Closed infraction or null if not found
 */
export async function closeInfraction(infractionId: Types.ObjectId | string): Promise<InfractionDocument | null> {
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

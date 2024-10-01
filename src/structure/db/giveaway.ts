import type { Types, UpdateQuery } from 'mongoose';

import { giveawayModel } from 'models/giveaway';

import type { GiveawayDocument } from 'types/giveaway';

import { shuffle } from 'utils/common';

/**
 * Create a giveaway
 * @param {string} guildId Guild ID of the giveaway
 * @param {string} channelId Channel ID of the giveaway
 * @param {string} messageId Message ID of the giveaway
 * @param {string} prize Prize of the giveaway
 * @param {number} duration Duration of the giveaway
 * @param {number} winnerCount Amount of winners
 * @param {number} endsAt Unixtimestamp of when the giveaway ends
 * @param {number} createdAt Unixtimestamp of when the giveaway was created
 * @returns {Promise<GiveawayDocument>} Created giveaway
 */
export async function createGiveaway(
  guildId: string,
  channelId: string,
  messageId: string,
  prize: string,
  duration: number,
  winnerCount: number,
  endsAt: number,
  createdAt: number
): Promise<GiveawayDocument> {
  return await giveawayModel.create({
    guildId,
    channelId,
    messageId,
    prize,
    duration,
    winnerCount,
    createdAt,
    endsAt,
    winnerIds: [],
    participants: []
  });
}

/**
 * Find a giveaway by message ID
 * @param {string} messageId ID of the giveaway
 * @returns {Promise<GiveawayDocument | null>} Giveaway or null if not found
 */
export async function findGiveawayByMessage(messageId: string): Promise<GiveawayDocument | null> {
  return await giveawayModel.findOne({ messageId }).lean().exec();
}

/**
 * Find a giveaway by ID
 * @param {Types.ObjectId | string} id ID of the giveaway
 * @returns {Promise<GiveawayDocument | null>} Giveaway or null if not found
 */
export async function findGiveawayById(id: Types.ObjectId | string): Promise<GiveawayDocument | null> {
  return await giveawayModel.findById(id).lean().exec();
}

/**
 * Update a giveaway
 * @param {Types.ObjectId | string} id ID of the giveaway
 * @param {UpdateQuery<GiveawayDocument>} query Update query
 * @returns {Promise<GiveawayDocument | null>} Updated giveaway or null if not found
 */
export async function updateGiveaway(id: Types.ObjectId | string, query: UpdateQuery<GiveawayDocument>): Promise<GiveawayDocument | null> {
  return await giveawayModel.findByIdAndUpdate(id, query, { new: true }).lean().exec();
}

/**
 * Delete a giveaway
 * @param {Types.ObjectId | string} id ID of the giveaway
 * @returns {Promise<GiveawayDocument | null>} Deleted giveaway or null if not found
 */
export async function deleteGiveaway(id: Types.ObjectId | string): Promise<GiveawayDocument | null> {
  return await giveawayModel.findByIdAndDelete(id).lean().exec();
}

/**
 * Get all giveaways of a guild
 * @param {string} guildId Guild ID to get the giveaways for
 * @returns {Promise<GiveawayDocument[]>} Giveaways of the guild
 */
export async function getGiveaways(guildId: string): Promise<GiveawayDocument[]> {
  return await giveawayModel.find({ guildId }).lean().exec();
}

/**
 * Get all giveaways
 * @returns {Promise<GiveawayDocument[]>} Giveaways
 */
export async function getAllGiveaways(): Promise<GiveawayDocument[]> {
  return await giveawayModel.find().lean().exec();
}

/**
 * Add a participant to a giveaway
 * @param {Types.ObjectId | string} giveawayId ID of the giveaway
 * @param {string} userId user ID of the participant to add
 * @returns {Promise<GiveawayDocument | null>} Giveaway or null if not found
 */
export async function addParticipant(giveawayId: Types.ObjectId | string, userId: string): Promise<GiveawayDocument | null> {
  return await updateGiveaway(giveawayId, { $push: { participants: userId } });
}

/**
 * Remove a participant from a giveaway
 * @param {Types.ObjectId | string} giveawayId ID of the giveaway
 * @param {string} userId user ID of the participant to remove
 * @returns {Promise<GiveawayDocument | null>} Giveaway or null if not found
 */
export async function removeParticipant(giveawayId: Types.ObjectId | string, userId: string): Promise<GiveawayDocument | null> {
  return await updateGiveaway(giveawayId, { $pull: { participants: userId } });
}

/**
 * Get winners from participants
 * @param {string[]} participants
 * @param {string[]} winnerIds
 * @param {number} winnerCount
 * @returns {string[]} Winners
 */
export function getWinners(participants: string[], winnerIds: string[], winnerCount: number): string[] {
  const shuffledParticipants = shuffle(participants);
  const winners = [];

  for (let i = 0; i < shuffledParticipants.length && winners.length < winnerCount; i++) {
    const participant = shuffledParticipants[i];
    if (!winnerIds.includes(participant)) {
      winners.push(participant);
    }
  }

  return winners;
}

import type { Types, UpdateQuery } from 'mongoose';

import { ticketModel } from 'models/ticket';

import type { TicketDocument } from 'types/ticket';

/**
 * Gets the ticket by its channel ID
 * @param {string} channelId Channel id of the ticket
 * @returns {Promise<TicketDocument | null>} Ticket or null if not found
 */
export async function findTicket(channelId: string): Promise<TicketDocument | null> {
  return await ticketModel.findOne({ channelId }, {}, { upsert: false }).lean().exec();
}

/**
 * Creates a ticket
 * @param {string} guildId Guild ID to create the ticket for
 * @param {string} channelId Channel id of the ticket
 * @param {string} createdBy User id of the user who created the ticket
 * @param {string[]} users Users to add to the ticket
 * @param {string} choice Reason for the ticket
 * @returns {Promise<TicketDocument>} Created ticket
 */
export async function createTicket(guildId: string, channelId: string, createdBy: string, users: string[], choice: string): Promise<TicketDocument> {
  return await ticketModel.create({
    guildId,
    channelId,
    createdBy,
    users,
    choice
  });
}

/**
 * Deletes a ticket by ID
 * @param {string} _id Ticket ID to delete
 * @returns {Promise<TicketDocument | null>} Deleted ticket or null if not found
 */
export async function deleteTicketById(_id: Types.ObjectId | string): Promise<TicketDocument | null> {
  return await ticketModel.findByIdAndDelete(_id);
}

/**
 * Deletes a ticket by channel ID
 * @param {string} channelId Channel ID to delete the ticket for
 * @returns {Promise<TicketDocument | null>} Deleted ticket or null if not found
 */
export async function deleteTicketByChannel(channelId: string): Promise<TicketDocument | null> {
  return await ticketModel.findOneAndDelete({ channelId }).lean().exec();
}

/**
 * Gets all tickets for a user
 * @param {string} guildId Guild ID to get the tickets for
 * @param {string} createdBy User ID to get the tickets for
 * @returns {Promise<TicketDocument[]>} Tickets
 */
export async function getTicketsByUser(guildId: string, createdBy: string): Promise<TicketDocument[]> {
  return await ticketModel.find({ guildId, createdBy });
}

/**
 * Updates a ticket
 * @param {string} channelId Channel ID of the ticket
 * @param {UpdateQuery<TicketDocument>} query Query to update the ticket with
 * @returns {Promise<TicketDocument | null>} Updated ticket
 */
export async function updateTicket(channelId: string, query: UpdateQuery<TicketDocument>): Promise<TicketDocument | null> {
  return await ticketModel.findOneAndUpdate({ channelId }, query).lean().exec();
}

/**
 * Claim ticket
 * @param {string} channelId Channel id of the ticket
 * @param {string} claimedBy User id of the user who claimed the ticket
 * @returns {Promise<TicketDocument | null>} Claimed ticket
 */
export async function claimTicket(channelId: string, claimedBy: string): Promise<TicketDocument | null> {
  return await updateTicket(channelId, { $set: { claimedBy } });
}

/**
 * Close ticket
 * @param {string} channelId Channel id of the ticket
 * @returns {Promise<TicketDocument | null>} Closed ticket
 */
export async function closeTicket(channelId: string): Promise<TicketDocument | null> {
  return await updateTicket(channelId, { $set: { closed: true } });
}

/**
 * Lock ticket
 * @param {string} channelId Channel id of the ticket
 * @returns {Promise<TicketDocument | null>} Locked ticket
 */
export async function lockTicket(channelId: string): Promise<TicketDocument | null> {
  return await updateTicket(channelId, { $set: { locked: true } });
}

/**
 * Unlock ticket
 * @param {string} channelId Channel id of the ticket
 * @returns {Promise<TicketDocument | null>} Unlocked ticket
 */
export async function unlockTicket(channelId: string): Promise<TicketDocument | null> {
  return await updateTicket(channelId, { $set: { locked: false } });
}

/**
 * Adds a user to a ticket
 * @param {string} channelId Channel id of the ticket
 * @param {string} userId User id to add to the ticket
 * @returns {Promise<TicketDocument | null>} Updated ticket
 */
export async function addUserToTicket(channelId: string, userId: string): Promise<TicketDocument | null> {
  return await updateTicket(channelId, { $push: { users: userId } });
}

/**
 * Removes a user from a ticket
 * @param {string} channelId Channel id of the ticket
 * @param {string} userId User id to remove from the ticket
 * @returns {Promise<TicketDocument | null>} Updated ticket
 */
export async function removeUserFromTicket(channelId: string, userId: string): Promise<TicketDocument | null> {
  return await updateTicket(channelId, { $pull: { users: userId } });
}

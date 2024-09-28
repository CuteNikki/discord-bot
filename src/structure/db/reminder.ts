import type { Types } from 'mongoose';

import { reminderModel } from 'models/reminder';

import type { ReminderDocument } from 'types/reminder';

/**
 * Gets all reminders for a user
 * @param {string} userId
 * @returns {Promise<ReminderDocument[]>} Reminders
 */
export async function getReminders(userId: string): Promise<ReminderDocument[]> {
  return await reminderModel.find({ userId }).lean().exec();
}

/**
 * Creates a reminder
 * @param {string} userId
 * @param {string} channelId
 * @param {number} remindAt
 * @param {string} message
 * @returns {Promise<ReminderDocument>} Created reminder
 */
export async function createReminder(userId: string, channelId: string, remindAt: number, message: string): Promise<ReminderDocument> {
  return await reminderModel.create({
    userId,
    channelId,
    remindAt,
    message,
  });
}

/**
 * Deletes a reminder by Id
 * @param {string} reminderId
 * @returns {Promise<ReminderDocument>} Deleted reminder or null if not found
 */
export async function deleteReminder(reminderId: Types.ObjectId | string): Promise<ReminderDocument | null> {
  return await reminderModel.findByIdAndDelete(reminderId).lean().exec();
}

/**
 * Gets all reminders that have expired
 * @param {number} date The date to check for
 * @returns {Promise<ReminderDocument[]>} Expired reminders
 */
export async function getExpiredReminders(date?: number): Promise<ReminderDocument[]> {
  return await reminderModel
    .find({ remindAt: { $lte: date ?? Date.now() } })
    .lean()
    .exec();
}

/**
 * Deletes all expired reminders
 * @param {number} date The date to check for
 * @returns
 */
export async function deleteExpiredReminders(date?: number) {
  return await reminderModel.deleteMany({ remindAt: { $lte: date ?? Date.now() } });
}

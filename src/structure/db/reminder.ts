import { reminderModel, type Reminder } from 'models/reminder';

/**
 * Gets all reminders for a user
 * @param {string} userId
 * @returns {Promise<Reminder[]>} Reminders
 */
export async function getReminders(userId: string): Promise<Reminder[]> {
  return await reminderModel.find({ userId }).lean().exec();
}

/**
 * Creates a reminder
 * @param {string} userId
 * @param {string} channelId
 * @param {number} remindAt
 * @param {string} message
 * @returns {Promise<Reminder>} Created reminder
 */
export async function createReminder(userId: string, channelId: string, remindAt: number, message: string): Promise<Reminder> {
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
 * @returns {Promise<Reminder>} Deleted reminder or null if not found
 */
export async function deleteReminder(reminderId: string): Promise<Reminder | null> {
  return await reminderModel.findByIdAndDelete(reminderId).lean().exec();
}

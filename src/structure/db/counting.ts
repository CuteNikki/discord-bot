import type { UpdateQuery } from 'mongoose';

import { updateGuild } from 'db/guild';
import { countingModel } from 'models/counting';

import type { CountingDocument } from 'types/counting';

/**
 * Gets the counting settings
 * @param {string} guildId Guild ID to get the counting settings for
 * @param {boolean} insert If true, inserts a new document if none exists (optional, default is false)
 * @returns {Promise<CountingDocument>} Client settings
 */
export async function getCounting<T extends boolean>(
  guildId: string,
  insert: T = false as T
): Promise<T extends true ? CountingDocument : CountingDocument | null> {
  let document = await countingModel.findOne({ guildId }).lean().exec() as CountingDocument | null;

  if (insert && !document) {
    document = await updateCounting(guildId, {});
  }

  return document as T extends true ? CountingDocument : CountingDocument | null;
}

/**
 * Updates the counting settings
 * @param {guildId} guildId Guild ID to update the counting settings for
 * @param {UpdateQuery<CountingDocument>} query Query to update the counting settings with
 * @returns {Promise<CountingDocument>} Updated counting settings
 */
export async function updateCounting(guildId: string, query: UpdateQuery<CountingDocument>): Promise<CountingDocument> {
  const document = await countingModel.findOneAndUpdate({ guildId }, query, { upsert: true, new: true }).lean().exec();

  await updateGuild(guildId, { $set: { counting: document._id } });

  return document;
}

/**
 * Sets up the counting settings
 * @param {string} guildId Guild ID to setup the counting for
 * @param {string} channelId Channel ID to set up the counting for
 * @param {boolean} resetOnFail Whether to reset on fail
 * @returns {Promise<CountingDocument>} Counting settings
 */
export async function setupCounting(guildId: string, channelId: string, resetOnFail: boolean): Promise<CountingDocument> {
  return await updateCounting(guildId, { $set: { channelId, resetOnFail, currentNumber: 0, currentNumberBy: null, currentNumberAt: null } });
}

/**
 * Resets the counting settings
 * @param {string} guildId Guild ID to reset the counting for
 * @returns {Promise<CountingDocument>} Updated counting settings
 */
export async function resetCounting(guildId: string): Promise<CountingDocument> {
  return await updateCounting(guildId, {
    $set: { channelId: null, resetOnFail: null, currentNumber: 0, highestNumber: 0, highestNumberAt: null, currentNumberBy: null, currentNumberAt: null }
  });
}

/**
 * Resets the counting settings
 * @param {string} guildId Guild ID to reset counting for
 * @returns {Promise<CountingDocument>} Updated counting settings
 */
export async function failedCounting(guildId: string): Promise<CountingDocument> {
  return await updateCounting(guildId, { $set: { currentNumber: 0, currentNumberBy: null, currentNumberAt: null } });
}

/**
 * Increases the counting
 * @param {string} guildId Guild ID to increase the counting for
 * @param {number} highestNumber Highest number
 * @param {number} highestNumberAt Highest number at
 * @param {number} nextNumber Next number
 * @param {string} numberBy Number by
 * @returns {Promise<CountingDocument>} Updated counting settings
 */
export async function increaseCounting(
  guildId: string,
  highestNumber: number,
  highestNumberAt: number,
  nextNumber: number,
  numberBy: string
): Promise<CountingDocument> {
  return await updateCounting(guildId, {
    $set: {
      highestNumber: Math.max(highestNumber, nextNumber),
      highestNumberAt: nextNumber >= highestNumber ? Date.now() : highestNumberAt,
      currentNumber: nextNumber,
      currentNumberBy: numberBy,
      currentNumberAt: Date.now()
    }
  });
}

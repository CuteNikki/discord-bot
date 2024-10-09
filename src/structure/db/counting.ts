import { updateGuildSettings } from 'db/guild';
import { countingModel } from 'models/counting';

import type { CountingDocument } from 'types/counting';

/**
 * Gets the counting
 * @param {string} guildId Guild ID to get the counting for
 * @returns {Promise<Counting | null>} Counting
 */
export async function getCounting(guildId: string): Promise<CountingDocument | null> {
  return await countingModel.findOne({ guildId }).lean().exec();
}

/**
 * Sets up the counting
 * @param {string} guildId Guild ID to setup the counting for
 * @param {string} channelId Channel ID to set up the counting for
 * @param {boolean} resetOnFail Reset on fail
 * @returns {Promise<CountingDocument>} Counting
 */
export async function setupCounting(guildId: string, channelId: string, resetOnFail: boolean): Promise<CountingDocument> {
  const document = await countingModel.findOneAndUpdate(
    { guildId },
    { $set: { channelId, resetOnFail, currentNumber: 0, currentNumberBy: null, currentNumberAt: null } },
    { upsert: true, new: true }
  );

  await updateGuildSettings(guildId, { $set: { counting: document._id } });

  return document;
}

/**
 * Resets the counting
 * @param {string} guildId Guild ID to reset the counting for
 * @returns {Promise<CountingDocument>} Counting
 */
export async function resetCounting(guildId: string): Promise<CountingDocument> {
  const document = await countingModel.findOneAndUpdate(
    { guildId },
    { $set: { channelId: null, resetOnFail: null, currentNumber: 0, highestNumber: 0, highestNumberAt: null, currentNumberBy: null, currentNumberAt: null } },
    { upsert: true, new: true }
  );

  await updateGuildSettings(guildId, { $set: { counting: document._id } });

  return document;
}

/**
 * Updates the counting
 * @param {string} guildId Guild ID to update the counting for
 * @param {string} channelId Channel ID to update the counting for
 * @param {boolean} resetOnFail Reset on fail
 * @returns {Promise<CountingDocument>} Counting
 */
export async function updateCounting(guildId: string, channelId: string | null, resetOnFail: boolean): Promise<CountingDocument> {
  const document = await countingModel.findOneAndUpdate({ guildId }, { $set: { channelId, resetOnFail } }, { upsert: true, new: true });

  await updateGuildSettings(guildId, { $set: { counting: document._id } });

  return document;
}

/**
 * Resets the counting
 * @param {string} guildId Guild ID to reset counting for
 * @returns {Promise<CountingDocument | null>} CountingDocument
 */
export async function failedCounting(guildId: string): Promise<CountingDocument | null> {
  return await countingModel.findOneAndUpdate(
    { guildId },
    { $set: { currentNumber: 0, currentNumberBy: null, currentNumberAt: null } },
    { upsert: false, new: true }
  );
}

/**
 * Increases the counting
 * @param {string} guildId Guild ID to increase the counting for
 * @param {number} highestNumber Highest number
 * @param {number} highestNumberAt Highest number at
 * @param {number} nextNumber Next number
 * @param {string} numberBy Number by
 * @returns {Promise<CountingDocument>} CountingDocument
 */
export async function increaseCounting(
  guildId: string,
  highestNumber: number,
  highestNumberAt: number,
  nextNumber: number,
  numberBy: string
): Promise<CountingDocument | null> {
  return await countingModel.findOneAndUpdate(
    { guildId },
    {
      $set: {
        highestNumber: Math.max(highestNumber, nextNumber),
        highestNumberAt: nextNumber >= highestNumber ? Date.now() : highestNumberAt,
        currentNumber: nextNumber,
        currentNumberBy: numberBy,
        currentNumberAt: Date.now()
      }
    },
    { upsert: false, new: true }
  );
}

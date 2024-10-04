import { getGuildSettings, updateGuildSettings } from 'db/guild';

import type { Counting } from 'types/counting';
import type { GuildDocument } from 'types/guild';

/**
 * Gets the counting
 * @param {string} guildId Guild ID to get the counting for
 * @returns {Promise<Counting>} Counting
 */
export async function getCounting(guildId: string): Promise<Counting> {
  return (await getGuildSettings(guildId)).counting;
}

/**
 * Sets up the counting
 * @param {string} guildId Guild ID to setup the counting for
 * @param {string} channelId Channel ID to set up the counting for
 * @param {boolean} resetOnFail Reset on fail
 * @returns {Promise<GuildDocument>} Updated guild config
 */
export async function setupCounting(guildId: string, channelId: string, resetOnFail: boolean): Promise<GuildDocument> {
  return await updateGuildSettings(guildId, {
    $set: {
      'counting.channelId': channelId,
      'counting.resetOnFail': resetOnFail,
      'counting.currentNumber': 0,
      'counting.currentNumberBy': null,
      'counting.currentNumberAt': null
    }
  });
}

/**
 * Resets the counting
 * @param {string} guildId Guild ID to reset the counting for
 * @returns {Promise<GuildDocument>} Updated guild config
 */
export async function resetCounting(guildId: string): Promise<GuildDocument> {
  return await updateGuildSettings(guildId, {
    $set: {
      ['counting.channelId']: null,
      ['counting.resetOnFail']: false,
      ['counting.highestNumber']: 0,
      ['counting.highestNumberAt']: null,
      ['counting.currentNumber']: 0,
      ['counting.currentNumberBy']: null,
      ['counting.currentNumberAt']: null
    }
  });
}

/**
 * Updates the counting
 * @param {string} guildId Guild ID to update the counting for
 * @param {string} channelId Channel ID to update the counting for
 * @param {boolean} resetOnFail Reset on fail
 * @returns {Promise<GuildDocument>} Updated guild config
 */
export async function updateCounting(guildId: string, channelId: string, resetOnFail: boolean): Promise<GuildDocument> {
  return await updateGuildSettings(guildId, {
    $set: {
      'counting.channelId': channelId,
      'counting.resetOnFail': resetOnFail
    }
  });
}

/**
 * Resets the counting
 * @param {string} guildId Guild ID to reset counting for
 * @returns {Promise<GuildDocument>} Updated guild config
 */
export async function failedCounting(guildId: string): Promise<GuildDocument> {
  return await updateGuildSettings(guildId, {
    $set: {
      'counting.currentNumber': 0,
      'counting.currentNumberBy': null,
      'counting.currentNumberAt': null
    }
  });
}

/**
 * Increases the counting
 * @param {string} guildId Guild ID to increase the counting for
 * @param {number} highestNumber Highest number
 * @param {number} highestNumberAt Highest number at
 * @param {number} nextNumber Next number
 * @param {string} numberBy Number by
 * @returns {Promise<GuildDocument>} Updated guild config
 */
export async function increaseCounting(
  guildId: string,
  highestNumber: number,
  highestNumberAt: number,
  nextNumber: number,
  numberBy: string
): Promise<GuildDocument> {
  return await updateGuildSettings(guildId, {
    $set: {
      'counting.highestNumber': Math.max(highestNumber, nextNumber),
      'counting.highestNumberAt': nextNumber >= highestNumber ? Date.now() : highestNumberAt,
      'counting.currentNumber': nextNumber,
      'counting.currentNumberBy': numberBy,
      'counting.currentNumberAt': Date.now()
    }
  });
}

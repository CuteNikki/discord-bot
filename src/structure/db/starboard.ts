import { getGuildSettings, updateGuildSettings } from 'db/guild';

import type { GuildDocument } from 'types/guild';
import type { Starboard } from 'types/starboard';

/**
 * Gets the starboard for a guild
 * @param {string} guildId ID of guild to get starboard for
 * @returns {Promise<Starboard>} Starboard
 */
export async function getStarboard(guildId: string): Promise<Starboard> {
  return (await getGuildSettings(guildId)).starboard;
}

/**
 * Removes a starboard message
 * @param {string} guildId ID of guild to remove on
 * @param {string} messageId Message ID to remove
 * @returns {Promise<GuildDocument>} Updated guild config
 */
export async function removeStarboardMessage(guildId: string, messageId: string): Promise<GuildDocument> {
  return await updateGuildSettings(guildId, { $pull: { ['starboard.messages']: { messageId } } });
}

export async function addStarboardMessage(guildId: string, messageId: string, reactedUsers: string[]): Promise<GuildDocument> {
  return await updateGuildSettings(guildId, { $push: { ['starboard.messages']: { messageId, reactedUsers } } });
}

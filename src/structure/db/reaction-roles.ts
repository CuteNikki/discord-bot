import type { Types } from 'mongoose';

import { updateGuildSettings } from 'db/guild';
import type { GuildSettings } from 'models/guild';

import type { Reaction } from 'types/reaction-roles';

/**
 * Enables reaction roles
 * @param {string} guildId
 * @returns {Promise<GuildSettings>} Updated guild settings
 */
export async function enableReactionRoles(guildId: string): Promise<GuildSettings> {
  return await updateGuildSettings(guildId, { $set: { reactionRoles: { enabled: true } } });
}

/**
 * Disables reaction roles
 * @param {string} guildId
 * @returns {Promise<GuildSettings>} Updated guild settings
 */
export async function disableReactionRoles(guildId: string): Promise<GuildSettings> {
  return await updateGuildSettings(guildId, { $set: { reactionRoles: { enabled: false } } });
}

/**
 * Adds a reaction role group
 * @param {string} guildId
 * @param {string} messageId
 * @param {Reaction[]} reactions
 * @returns {Promise<GuildSettings>} Updated guild settings
 */
export async function addReactionGroup(guildId: string, messageId: string, channelId: string, reactions: Reaction[]): Promise<GuildSettings> {
  return await updateGuildSettings(guildId, { $push: { ['reactionRoles.groups']: { messageId, channelId, reactions } } });
}

/**
 * Removes a reaction role group by ID
 * @param {string} guildId
 * @param {Types.ObjectId} _id
 * @returns {Promise<GuildSettings>} Updated guild settings
 */
export async function deleteReactionGroupById(guildId: string, _id: string): Promise<GuildSettings> {
  return await updateGuildSettings(guildId, { $pull: { ['reactionRoles.groups']: { _id } } });
}

/**
 * Removes a reaction role group by message ID
 * @param {string} guildId
 * @param {string} messageId
 * @returns {Promise<GuildSettings>} Updated guild settings
 */
export async function deleteReactionGroupByMessage(guildId: string, messageId: string): Promise<GuildSettings> {
  return await updateGuildSettings(guildId, { $pull: { ['reactionRoles.groups']: { messageId } } });
}

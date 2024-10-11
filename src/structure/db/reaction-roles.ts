import { updateGuild } from 'db/guild';
import { reactionRoleGroupModel, reactionRoleModel } from 'models/reaction-roles';
import type { UpdateQuery } from 'mongoose';

import type { Reaction, ReactionRoleDocument, ReactionRoleGroupDocument } from 'types/reaction-roles';

/**
 * Gets the reaction roles for a guild
 * @param {string} guildId
 * @returns {Promise<ReactionRoleDocument | null>} Reaction roles
 */
export async function getReactionRoles<T extends boolean>(
  guildId: string,
  insert: T = false as T,
  populate: string[] = []
): Promise<T extends true ? ReactionRoleDocument : ReactionRoleDocument | null> {
  let document = await reactionRoleModel.findOne({ guildId }).lean().exec();

  if (insert && !document) {
    document = await updateReactionRoles(guildId, {}, populate);
  }

  return document as T extends true ? ReactionRoleDocument : ReactionRoleDocument | null;
}

/**
 * Updates a reaction role config
 * @param {string} guildId
 * @param {UpdateQuery<ReactionRoleDocument>} query
 * @param {string[]} populate
 * @returns {Promise<ReactionRoleDocument>} Updated reaction role config
 */
export async function updateReactionRoles(guildId: string, query: UpdateQuery<ReactionRoleDocument>, populate: string[] = []): Promise<ReactionRoleDocument> {
  return await reactionRoleModel.findOneAndUpdate({ guildId }, query, { new: true, upsert: true }).populate(populate).lean().exec();
}

/**
 * Enables reaction roles
 * @param {string} guildId
 * @returns {Promise<ReactionRoleDocument>} Updated reaction roles
 */
export async function enableReactionRoles(guildId: string): Promise<ReactionRoleDocument> {
  return await updateReactionRoles(guildId, { $set: { enabled: true } });
}

/**
 * Disables reaction roles
 * @param {string} guildId
 * @returns {Promise<ReactionRoleDocument>} Updated reaction roles
 */
export async function disableReactionRoles(guildId: string): Promise<ReactionRoleDocument> {
  return await updateReactionRoles(guildId, { $set: { enabled: false } });
}

/**
 * Adds a reaction role group
 * @param {string} guildId
 * @param {string} messageId
 * @param {Reaction[]} reactions
 * @returns {Promise<ReactionRoleGroupDocument>} Created reaction role group
 */
export async function addReactionGroup(guildId: string, messageId: string, channelId: string, reactions: Reaction[]): Promise<ReactionRoleGroupDocument> {
  const group = await reactionRoleGroupModel.create({ messageId, channelId, reactions });

  const document = await reactionRoleModel
    .findOneAndUpdate({ guildId }, { $push: { groups: group._id } }, { new: true, upsert: true })
    .lean()
    .exec();

  await updateGuild(guildId, { $set: { reactionRoles: document._id } });

  return group;
}

/**
 * Removes a reaction role group by ID
 * @param {string} guildId
 * @param {Types.ObjectId} _id
 * @returns {Promise<ReactionRoleGroupDocument | null>} The deleted group or null
 */
export async function deleteReactionGroupById(guildId: string, _id: string): Promise<ReactionRoleGroupDocument | null> {
  await reactionRoleModel
    .findOneAndUpdate({ guildId }, { $pull: { groups: { _id } } }, { new: true, upsert: true })
    .lean()
    .exec();

  return await reactionRoleGroupModel.findOneAndDelete({ _id }).lean().exec();
}

/**
 * Removes a reaction role group by message ID
 * @param {string} guildId
 * @param {string} messageId
 * @returns {Promise<ReactionRoleGroupDocument | null>} The deleted group or null
 */
export async function deleteReactionGroupByMessage(guildId: string, messageId: string): Promise<ReactionRoleGroupDocument | null> {
  await reactionRoleModel
    .findOneAndUpdate({ guildId }, { $pull: { groups: { messageId } } }, { new: true, upsert: true })
    .lean()
    .exec();

  return await reactionRoleGroupModel.findOneAndDelete({ messageId }).lean().exec();
}

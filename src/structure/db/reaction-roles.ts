import { reactionRoleDocumentModel, reactionRoleGroupDocumentModel } from 'models/reaction-roles';

import type { Reaction, ReactionRoleDocument, ReactionRoleGroupDocument } from 'types/reaction-roles';

/**
 * Gets the reaction roles for a guild
 * @param {string} guildId
 * @returns {Promise<ReactionRoleDocument | null>} Reaction roles
 */
export async function getReactionRoles(guildId: string): Promise<ReactionRoleDocument | null> {
  return await reactionRoleDocumentModel.findOne({ guildId }).populate('groups').lean().exec();
}

/**
 * Enables reaction roles
 * @param {string} guildId
 * @returns {Promise<ReactionRoleDocument>} Updated reaction roles
 */
export async function enableReactionRoles(guildId: string): Promise<ReactionRoleDocument> {
  return await reactionRoleDocumentModel
    .findOneAndUpdate({ guildId }, { $set: { enabled: true } }, { new: true, upsert: true })
    .lean()
    .exec();
}

/**
 * Disables reaction roles
 * @param {string} guildId
 * @returns {Promise<ReactionRoleDocument>} Updated reaction roles
 */
export async function disableReactionRoles(guildId: string): Promise<ReactionRoleDocument> {
  return await reactionRoleDocumentModel.findOneAndUpdate({ guildId }, { $set: { enabled: false } }, { new: true, upsert: true });
}

/**
 * Adds a reaction role group
 * @param {string} guildId
 * @param {string} messageId
 * @param {Reaction[]} reactions
 * @returns {Promise<ReactionRoleGroupDocument>} Created reaction role group
 */
export async function addReactionGroup(guildId: string, messageId: string, channelId: string, reactions: Reaction[]): Promise<ReactionRoleGroupDocument> {
  const group = await reactionRoleGroupDocumentModel.create({ messageId, channelId, reactions });

  await reactionRoleDocumentModel
    .findOneAndUpdate({ guildId }, { $push: { groups: group._id } }, { new: true, upsert: true })
    .lean()
    .exec();

  return group;
}

/**
 * Removes a reaction role group by ID
 * @param {string} guildId
 * @param {Types.ObjectId} _id
 * @returns {Promise<ReactionRoleGroupDocument | null>} The deleted group or null
 */
export async function deleteReactionGroupById(guildId: string, _id: string): Promise<ReactionRoleGroupDocument | null> {
  await reactionRoleDocumentModel
    .findOneAndUpdate({ guildId }, { $pull: { groups: { _id } } }, { new: true, upsert: true })
    .lean()
    .exec();

  return await reactionRoleGroupDocumentModel.findOneAndDelete({ _id }).lean().exec();
}

/**
 * Removes a reaction role group by message ID
 * @param {string} guildId
 * @param {string} messageId
 * @returns {Promise<ReactionRoleGroupDocument | null>} The deleted group or null
 */
export async function deleteReactionGroupByMessage(guildId: string, messageId: string): Promise<ReactionRoleGroupDocument | null> {
  await reactionRoleDocumentModel
    .findOneAndUpdate({ guildId }, { $pull: { groups: { messageId } } }, { new: true, upsert: true })
    .lean()
    .exec();

  return await reactionRoleGroupDocumentModel.findOneAndDelete({ messageId }).lean().exec();
}

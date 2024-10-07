import mongoose, { Model, model, Schema, Types } from 'mongoose';

import type { ReactionRoleDocument, ReactionRoleGroupDocument } from 'types/reaction-roles';

const reactionRoleGroupDocumentSchema = new Schema<ReactionRoleGroupDocument>({
  messageId: { type: String, required: true },
  channelId: { type: String, required: true },
  reactions: [{ emoji: { type: String, required: true }, roleId: { type: String, required: true } }]
});

export const reactionRoleGroupDocumentModel: Model<ReactionRoleGroupDocument> =
  mongoose.models['reaction_role_group'] || model<ReactionRoleGroupDocument>('reaction_role_group', reactionRoleGroupDocumentSchema);

const reactionRoleDocumentSchema = new Schema<ReactionRoleDocument>({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false, required: true },
  groups: [{ type: Types.ObjectId, ref: 'reaction_role_group' }]
});

export const reactionRoleDocumentModel: Model<ReactionRoleDocument> =
  mongoose.models['reaction_role'] || model<ReactionRoleDocument>('reaction_role', reactionRoleDocumentSchema);

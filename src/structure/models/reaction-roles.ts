import mongoose, { Model, model, Schema, Types } from 'mongoose';

import type { ReactionRoleDocument, ReactionRoleGroupDocument } from 'types/reaction-roles';

export const reactionRoleGroupModel: Model<ReactionRoleGroupDocument> =
  mongoose.models['reaction_role_group'] ||
  model<ReactionRoleGroupDocument>(
    'reaction_role_group',
    new Schema<ReactionRoleGroupDocument>({
      messageId: { type: String, required: true },
      channelId: { type: String, required: true },
      singleMode: { type: Boolean, required: false, default: false },
      requiredRoles: [{ type: String, required: true }],
      reactions: [{ emoji: { type: String, required: true }, roleId: { type: String, required: true } }]
    })
  );

export const reactionRoleModel: Model<ReactionRoleDocument> =
  mongoose.models['reaction_role_config'] ||
  model<ReactionRoleDocument>(
    'reaction_role_config',
    new Schema<ReactionRoleDocument>({
      guildId: { type: String, required: true, unique: true },
      enabled: { type: Boolean, default: false, required: true },
      groups: [{ type: Types.ObjectId, ref: 'reaction_role_group' }]
    })
  );

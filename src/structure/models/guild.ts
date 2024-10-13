import mongoose, { Model, model, Schema, Types } from 'mongoose';

import { type GuildDocument } from 'types/guild';

export const guildModel: Model<GuildDocument> =
  mongoose.models['guild'] ||
  model<GuildDocument>(
    'guild',
    new Schema<GuildDocument>({
      guildId: { type: String, required: true },
      language: { type: String, required: false },
      customVoice: { type: Types.ObjectId, ref: 'custom_voice_config', required: false },
      starboard: { type: Types.ObjectId, ref: 'starboard_config', required: false },
      reactionRoles: { type: Types.ObjectId, ref: 'reaction_role_config', required: false },
      counting: { type: Types.ObjectId, ref: 'counting_config', required: false },
      ticket: { type: Types.ObjectId, ref: 'ticket_config', required: false },
      moderation: { type: Types.ObjectId, ref: 'moderation', required: false },
      level: { type: Types.ObjectId, ref: 'level_config', required: false },
      welcome: { type: Types.ObjectId, ref: 'welcome', required: false },
      farewell: { type: Types.ObjectId, ref: 'farewell', required: false },
      log: { type: Types.ObjectId, ref: 'guild_log', required: false }
    })
  );

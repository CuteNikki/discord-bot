import mongoose, { Model, model, Schema } from 'mongoose';

import type { GuildLogDocument } from 'types/guild-log';

export const guildLogModel: Model<GuildLogDocument> =
  mongoose.models['guild_log'] ||
  model<GuildLogDocument>(
    'guild_log',
    new Schema<GuildLogDocument>({
      guildId: { type: String, required: true, unique: true },
      enabled: { type: Boolean, default: false },
      events: [
        {
          name: { type: String, required: true },
          enabled: { type: Boolean, required: true },
          channelId: { type: String, required: true }
        }
      ]
    })
  );

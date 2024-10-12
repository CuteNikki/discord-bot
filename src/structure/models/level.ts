import mongoose, { Model, model, Schema } from 'mongoose';

import { AnnouncementType, type LevelConfigDocument, type LevelDocument, type WeeklyLevelDocument } from 'types/level';

export const levelModel: Model<LevelDocument> =
  mongoose.models['level'] ||
  model<LevelDocument>(
    'level',
    new Schema<LevelDocument>({
      userId: { type: String, required: true },
      guildId: { type: String, required: true },
      level: { type: Number, default: 0 },
      xp: { type: Number, default: 0 }
    })
  );

export const weeklyLevelModel: Model<WeeklyLevelDocument> =
  mongoose.models['weekly_level'] ||
  model<WeeklyLevelDocument>(
    'weekly_level',
    new Schema<WeeklyLevelDocument>({
      userId: { type: String, required: true },
      guildId: { type: String, required: true },
      level: { type: Number, default: 0 },
      xp: { type: Number, default: 0 }
    })
  );

export const levelConfigModel: Model<LevelConfigDocument> =
  mongoose.models['level_config'] ||
  model<LevelConfigDocument>(
    'level_config',
    new Schema<LevelConfigDocument>({
      guildId: { type: String, required: true, unique: true },
      enabled: { type: Boolean, default: false, required: true },
      channelId: { type: String, required: false },
      announcement: {
        type: Number,
        enum: Object.values(AnnouncementType).filter((value) => typeof value === 'number'),
        default: AnnouncementType.UserChannel,
        required: true
      },
      ignoredRoles: [{ type: String, required: false }],
      ignoredChannels: [{ type: String, required: false }],
      enabledChannels: [{ type: String, required: false }],
      rewards: [{ level: { type: Number, required: true }, roleId: { type: String, required: true } }],
      multipliers: [{ roleId: { type: String, required: true }, multiplier: { type: Number, required: true } }]
    })
  );

import mongoose, { Model, model, Schema } from 'mongoose';

import type { LevelDocument, WeeklyLevelDocument } from 'types/level';

export const levelModel: Model<LevelDocument> =
  mongoose.models['level'] ||
  model<LevelDocument>(
    'level',
    new Schema<LevelDocument>({
      userId: { type: String, required: true },
      guildId: { type: String, required: true },
      level: { type: Number, default: 0 },
      xp: { type: Number, default: 0 },
    }),
  );

export const weeklyLevelModel: Model<WeeklyLevelDocument> =
  mongoose.models['weekly_level'] ||
  model<WeeklyLevelDocument>(
    'weekly_level',
    new Schema<WeeklyLevelDocument>({
      userId: { type: String, required: true },
      guildId: { type: String, required: true },
      level: { type: Number, default: 0 },
      xp: { type: Number, default: 0 },
    }),
  );

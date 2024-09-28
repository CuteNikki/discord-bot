import mongoose, { Model, model, Schema } from 'mongoose';

import type { WeeklyLevelDocument } from 'types/level';

const weeklyLevelSchema = new Schema<WeeklyLevelDocument>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  level: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
});

export const weeklyLevelModel: Model<WeeklyLevelDocument> = mongoose.models['weekly_level'] || model<WeeklyLevelDocument>('weekly_level', weeklyLevelSchema);

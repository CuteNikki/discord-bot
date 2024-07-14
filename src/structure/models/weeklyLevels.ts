import mongoose, { Model, model, Schema, Types } from 'mongoose';

export interface WeeklyLevel {
  _id: Types.ObjectId;
  userId: string;
  guildId: string;
  level: number;
  xp: number;
}

const weeklyLevelSchema = new Schema<WeeklyLevel>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  level: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
});

export const weeklyLevelModel: Model<WeeklyLevel> = mongoose.models['weekly_level'] || model<WeeklyLevel>('weekly_level', weeklyLevelSchema);

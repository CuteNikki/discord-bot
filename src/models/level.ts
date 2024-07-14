import mongoose, { Model, model, Schema, Types } from 'mongoose';

export interface Level {
  _id: Types.ObjectId;
  userId: string;
  guildId: string;
  level: number;
  xp: number;
}

const levelSchema = new Schema<Level>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  level: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
});

export const levelModel: Model<Level> = mongoose.models['level'] || model<Level>('level', levelSchema);

import mongoose, { Model, model, Schema, Types } from 'mongoose';

export type Level = {
  _id: Types.ObjectId;
  userId: string;
  guildId: string;
  level: number;
  xp: number;
};

/**
 * This type is used to get the rank of a user in the leaderboard
 *
 * Username is only available in the computed leaderboard
 */
export type PositionLevel = Level & { position: number; username?: string };

const levelSchema = new Schema<Level>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  level: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
});

export const levelModel: Model<Level> = mongoose.models['level'] || model<Level>('level', levelSchema);

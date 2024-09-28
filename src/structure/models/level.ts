import mongoose, { Model, model, Schema } from 'mongoose';

import type { LevelDocument } from 'types/level';

const levelSchema = new Schema<LevelDocument>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  level: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
});

export const levelModel: Model<LevelDocument> = mongoose.models['level'] || model<LevelDocument>('level', levelSchema);

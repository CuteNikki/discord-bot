import mongoose from 'mongoose';

export const levelModel = mongoose.model(
  'level',
  new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    level: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
  })
);

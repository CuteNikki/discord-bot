import mongoose from 'mongoose';

export const guildModel = mongoose.model(
  'guild',
  new mongoose.Schema({
    guildId: { type: String, required: true },
  })
);

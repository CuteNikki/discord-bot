import mongoose from 'mongoose';

const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
});

export const guildModel = mongoose.model('guild', guildSchema);

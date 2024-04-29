import mongoose from 'mongoose';

const guildSchema = new mongoose.Schema({
  guildId: String,
});

export const guildModel = mongoose.model('guild', guildSchema);

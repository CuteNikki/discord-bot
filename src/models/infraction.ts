import mongoose from 'mongoose';

export enum InfractionType {
  BAN = 'BAN',
  UNBAN = 'UNBAN',
  TEMPBAN = 'TEMPBAN',
  KICK = 'KICK',
  TIMEOUT = 'TIMEOUT',
  WARN = 'WARN',
}

export const infractionModel = mongoose.model(
  'infraction',
  new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    staffId: { type: String, required: true },
    action: { type: String, enum: Object.values(InfractionType), required: true },
    createdAt: { type: Number, default: Date.now() },
    reason: { type: String, required: false },
  })
);

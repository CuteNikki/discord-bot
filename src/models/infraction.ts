import mongoose from 'mongoose';

export enum InfractionType {
  Ban,
  Unban,
  TempBan,
  Kick,
  Timeout,
  Warn,
}

export const infractionModel = mongoose.model(
  'infraction',
  new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    moderatorId: { type: String, required: true },
    action: { type: Number, enum: Object.values(InfractionType).filter((value) => typeof value === 'number'), required: true },
    createdAt: { type: Number, default: Date.now() },
    reason: { type: String, required: false },
    endsAt: { type: Number, required: false },
    closed: { type: Boolean, default: true },
  })
);

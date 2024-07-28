import mongoose, { Model, model, Schema, Types } from 'mongoose';

export enum InfractionType {
  Ban,
  Unban,
  TempBan,
  Kick,
  Timeout,
  Warn,
}

export interface Infraction {
  _id: Types.ObjectId;
  userId: string;
  guildId: string;
  staffId: string;
  action: number;
  createdAt: number;
  reason?: string;
  endsAt?: number;
  closed: boolean;
}

const infractionSchema = new Schema<Infraction>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  staffId: { type: String, required: true },
  action: { type: Number, enum: Object.values(InfractionType).filter((value) => typeof value === 'number'), required: true },
  createdAt: { type: Number, default: Date.now() },
  reason: { type: String, required: false },
  endsAt: { type: Number, required: false },
  closed: { type: Boolean, default: true },
});

export const infractionModel: Model<Infraction> = mongoose.models['infraction'] || model<Infraction>('infraction', infractionSchema);

import mongoose, { Model, model, Schema } from 'mongoose';
import { InfractionType, type InfractionDocument } from 'types/infraction';

const infractionSchema = new Schema<InfractionDocument>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  staffId: { type: String, required: true },
  action: {
    type: Number,
    enum: Object.values(InfractionType).filter((value) => typeof value === 'number'),
    required: true,
  },
  createdAt: { type: Number, default: Date.now() },
  reason: { type: String, required: false },
  endsAt: { type: Number, required: false },
  closed: { type: Boolean, default: true },
});

export const infractionModel: Model<InfractionDocument> = mongoose.models['infraction'] || model<InfractionDocument>('infraction', infractionSchema);

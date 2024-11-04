import mongoose, { Model, model, Schema } from 'mongoose';
import type { EconomyDocument } from 'types/economy';

export const economyModel: Model<EconomyDocument> =
  mongoose.models['economy_config'] ||
  model<EconomyDocument>(
    'economy_config',
    new Schema<EconomyDocument>({
      guildId: { type: String, required: true },
      enabled: { type: Boolean, required: true }
    })
  );

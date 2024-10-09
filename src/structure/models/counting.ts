import mongoose, { Model, model, Schema } from 'mongoose';

import type { CountingDocument } from 'types/counting';

export const countingModel: Model<CountingDocument> =
  mongoose.models['counting'] ||
  model<CountingDocument>(
    'counting',
    new Schema<CountingDocument>({
      guildId: { type: String, required: true },
      channelId: { type: String, required: true },
      resetOnFail: { type: Boolean, default: false, required: true },
      highestNumber: { type: Number, default: 0, required: true },
      highestNumberAt: { type: Number, default: 0, required: false },
      currentNumber: { type: Number, default: 0, required: true },
      currentNumberBy: { type: String, required: false },
      currentNumberAt: { type: Number, default: 0, required: false }
    })
  );

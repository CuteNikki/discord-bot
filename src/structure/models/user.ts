import mongoose, { Model, model, Schema } from 'mongoose';

import { BadgeType, type UserDocument } from 'types/user';

export const userModel: Model<UserDocument> =
  mongoose.models['user'] ||
  model<UserDocument>(
    'user',
    new Schema<UserDocument>({
      userId: { type: String, required: true },
      banned: { type: Boolean, required: true, default: false },
      language: { type: String, required: false },
      badges: [
        {
          id: {
            type: Number,
            enum: Object.values(BadgeType).filter((value) => typeof value === 'number'),
            required: true
          },
          receivedAt: { type: Number, required: true }
        }
      ]
    })
  );

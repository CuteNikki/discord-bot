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
      ],
      economyOnboarding: { type: Boolean, required: true, default: true },
      marriedTo: { type: String, required: false },
      marriedAt: { type: Number, required: false },
      lastDaily: { type: Number, required: false },
      lastRob: { type: Number, required: false },
      lastWork: { type: Number, required: false },
      wallet: { type: Number, required: true, default: 0 },
      bank: { type: Number, required: true, default: 0 },
      description: { type: String, required: false },
      color: { type: String, required: false },
      inventory: [
        {
          id: { type: Number, required: true },
          category: { type: Number, required: true },
          emoji: { type: String, required: true },
          name: { type: String, required: true },
          description: { type: String, required: true }
        }
      ]
    })
  );

import mongoose from 'mongoose';

export enum BadgeType {
  DEVELOPER,
  MODERATOR,
  TRANSLATOR,
  SUPPORTER,
  EXPERT_BUGHUNTER,
  BUGHUNTER,
}

export interface Badge {
  id: BadgeType;
  receivedAt: number;
}

export interface User {
  userId: string;
  language: string;
  banned: boolean;
  badges: Badge[];
}

export const userModel = mongoose.model(
  'user',
  new mongoose.Schema<User>({
    userId: { type: String, required: true },
    language: { type: String, default: 'en' },
    banned: { type: Boolean, default: false },
    badges: [
      {
        id: { type: Number, enum: Object.values(BadgeType), required: true },
        receivedAt: { type: Number, required: true },
      },
    ],
  })
);

import mongoose, { Model, model, Schema, Types } from 'mongoose';

export enum BadgeType {
  Developer,
  StaffMember,
  Translator,
  Supporter,
  ExpertBughunter,
  Bughunter,
}

export interface Badge {
  id: BadgeType;
  receivedAt: number;
}

export interface UserData {
  _id: Types.ObjectId;
  userId: string;
  language?: string;
  banned: boolean;
  badges: Badge[];
}

const userSchema = new Schema<UserData>({
  userId: { type: String, required: true },
  language: { type: String, required: false },
  banned: { type: Boolean, default: false },
  badges: [
    {
      id: {
        type: Number,
        enum: Object.values(BadgeType).filter((value) => typeof value === 'number'),
        required: true,
      },
      receivedAt: { type: Number, required: true },
    },
  ],
});

export const userModel: Model<UserData> = mongoose.models['user'] || model<UserData>('user', userSchema);

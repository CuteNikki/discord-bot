import mongoose, { Model, model, Schema, Types } from 'mongoose';

export interface Reminder {
  _id: Types.ObjectId;
  userId: string;
  channelId: string;
  message: string;
  remindAt: number;
}

const reminderSchema = new Schema<Reminder>({
  userId: { type: String, required: true },
  channelId: { type: String, required: true },
  message: { type: String, required: true },
  remindAt: { type: Number, required: true },
});

export const reminderModel: Model<Reminder> = mongoose.models['reminder'] || model<Reminder>('reminder', reminderSchema);

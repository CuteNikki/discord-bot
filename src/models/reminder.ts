import mongoose from 'mongoose';

export interface Reminder {
  _id: string;
  userId: string;
  channelId: string;
  message: string;
  remindAt: number;
}

export const reminderModel = mongoose.model(
  'reminder',
  new mongoose.Schema<Reminder>({
    userId: { type: String, required: true },
    channelId: { type: String, required: true },
    message: { type: String, required: true },
    remindAt: { type: Number, required: true },
  })
);

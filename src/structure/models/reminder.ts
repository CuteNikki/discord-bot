import mongoose, { Model, model, Schema } from 'mongoose';
import type { ReminderDocument } from 'types/reminder';

export const reminderModel: Model<ReminderDocument> =
  mongoose.models['reminder'] ||
  model<ReminderDocument>(
    'reminder',
    new Schema<ReminderDocument>({
      userId: { type: String, required: true },
      channelId: { type: String, required: true },
      message: { type: String, required: true },
      remindAt: { type: Number, required: true }
    })
  );

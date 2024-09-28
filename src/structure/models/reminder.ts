import mongoose, { Model, model, Schema } from 'mongoose';
import type { ReminderDocument } from 'types/reminder';

const reminderSchema = new Schema<ReminderDocument>({
  userId: { type: String, required: true },
  channelId: { type: String, required: true },
  message: { type: String, required: true },
  remindAt: { type: Number, required: true },
});

export const reminderModel: Model<ReminderDocument> = mongoose.models['reminder'] || model<ReminderDocument>('reminder', reminderSchema);

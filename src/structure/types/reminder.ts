import type { Types } from 'mongoose';

export type ReminderDocument = {
  _id: Types.ObjectId;
  userId: string;
  channelId: string;
  message: string;
  remindAt: number;
};

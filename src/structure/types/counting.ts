import type { Types } from 'mongoose';

export type CountingDocument = {
  _id: Types.ObjectId;
  guildId: string;
  channelId: string;
  resetOnFail: boolean;
  currentNumberBy: string;
  currentNumberAt: number;
  currentNumber: number;
  highestNumber: number;
  highestNumberAt: number;
};

import type { Types } from 'mongoose';

export type ConnectionDocument = {
  _id: Types.ObjectId;
  channelIdOne: string;
  channelIdTwo: string;
  userIdOne: string;
  userIdTwo: string; // translation purposes
  lastMessageAt?: number; // used for timeout
};

export type AvailableChannelDocument = {
  _id: Types.ObjectId;
  channelId: string;
  userId: string;
};

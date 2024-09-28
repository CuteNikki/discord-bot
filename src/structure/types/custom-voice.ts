import type { Types } from 'mongoose';

export type CustomVoiceDocument = {
  _id: Types.ObjectId;
  channelId: string;
  guildId: string;
  ownerId: string;
};

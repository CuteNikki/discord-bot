import type { Types } from 'mongoose';

export type CustomVoiceDocument = {
  _id: Types.ObjectId;
  guildId: string;
  channelId: string;
  parentId: string;
};

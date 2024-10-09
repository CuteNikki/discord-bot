import type { Types } from 'mongoose';

export type CustomVoiceChannelDocument = {
  _id: Types.ObjectId;
  channelId: string;
  guildId: string;
  ownerId: string;
};

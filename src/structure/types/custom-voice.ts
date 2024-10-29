import type { Types } from 'mongoose';

export type CustomVoiceDocument = {
  _id: Types.ObjectId;
  guildId: string;
  enabled: boolean;
  channelId: string;
  parentId: string;
  defaultLimit: number;
};

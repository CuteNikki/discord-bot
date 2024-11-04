import type { Types } from 'mongoose';

export type EconomyDocument = {
  _id: Types.ObjectId;
  guildId: string;
  enabled: boolean;
};

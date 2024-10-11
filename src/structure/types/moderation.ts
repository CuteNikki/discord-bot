import type { Types } from 'mongoose';

export type ModerationDocument = {
  _id: Types.ObjectId;
  guildId: string;
  enabled: boolean;
  staffroleId?: string;
  reasonsRequired: boolean;
};

import type { Types } from 'mongoose';

export type Reaction = {
  emoji: string;
  roleId: string;
};

export type ReactionRoleGroupDocument = {
  _id: Types.ObjectId;
  messageId: string;
  channelId: string;
  singleMode?: boolean;
  requiredRoles?: string[];
  reactions: Reaction[];
};

export type ReactionRoleDocument = {
  _id: Types.ObjectId;
  guildId: string;
  enabled: boolean;
  groups: ReactionRoleGroupDocument[];
};

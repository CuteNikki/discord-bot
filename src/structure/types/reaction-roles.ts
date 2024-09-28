import type { Types } from "mongoose";

export type Reaction = {
  emoji: string;
  roleId: string;
};

export type ReactionRoleGroup = {
  _id: Types.ObjectId;
  messageId: string;
  channelId: string;
  reactions: Reaction[];
};

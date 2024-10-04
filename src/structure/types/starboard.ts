export type Starboard = {
  enabled: boolean;
  channelId?: string;
  minimumStars?: number;
  messages: { messageId: string; starboardMessageId?: string; reactedUsers: string[] }[];
};

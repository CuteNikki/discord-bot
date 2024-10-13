export type GuildLogEvent = {
  name: string;
  enabled: boolean;
  channelId: string;
};

export type GuildLogDocument = {
  guildId: string;
  enabled: boolean;
  events: GuildLogEvent[];
};

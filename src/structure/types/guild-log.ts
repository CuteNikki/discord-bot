import type { ChannelType } from 'discord.js';

/**
 * Represents a log event definition.
 */
export type LogEventDefinition = {
  /** Name of the event */
  name: string;
  /** Description of the event */
  description: string;
  /** Whether the event can be excluded for specific channels */
  canExcludeChannels: boolean;
  /** Whether the event can be included for specific channels */
  canIncludeChannels: boolean;
  /** Whether the event can be excluded for specific roles */
  canExcludeRoles: boolean;
  /** Whether the event can be included for specific roles */
  canIncludeRoles: boolean;
  /** Whether the event can be excluded for specific users */
  canExcludeUsers: boolean;
  /** Whether the event can be included for specific users */
  canIncludeUsers: boolean;
  /** If defined, only these channel types can be excluded */
  excludableChannelTypes?: ChannelType[];
  /** If defined, only these channel types can be included */
  includableChannelTypes?: ChannelType[];
  /** If defined, all channel types are excludable except the ones in this array */
  notExcludableChannelTypes?: ChannelType[];
  /** If defined, all channel types are includable except the ones in this array */
  notIncludableChannelTypes?: ChannelType[];
  /** Whether the excluded users can be bots only */
  canExcludeBotsOnly?: boolean;
  /** Whether the included users can be bots only */
  canIncludeBotsOnly?: boolean;
};

/**
 * Represents a log event.
 */
export type LoggedEvent = {
  /** Name of the event */
  name: string;
  /** Whether the event is enabled */
  enabled?: boolean;
  /** Channel ID where the event is logged */
  channelId?: string;
  /** Array of channel IDs where the event is excluded */
  excludedChannels?: string[];
  /** Array of role IDs where the event is excluded */
  excludedRoles?: string[];
  /** Array of user IDs where the event is excluded */
  excludedUsers?: string[];
};

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

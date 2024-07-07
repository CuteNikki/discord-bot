import {
  ApplicationCommandType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  MessageContextMenuCommandInteraction,
  UserContextMenuCommandInteraction,
  type RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js';
import { DiscordClient } from './client';

export enum Contexts {
  GUILD = 0,
  BOT_DM = 1,
  PRIVATE_CHANNEL = 2,
}

export enum IntegrationTypes {
  GUILD_INSTALL = 0,
  USER_INSTALL = 1,
}

export enum ModuleType {
  DEVELOPER = 'DEVELOPER',
  MODERATION = 'MODERATION',
  LEVEL = 'LEVEL',
  GENERAL = 'GENERAL',
  UTILITIES = 'UTILITIES',
  CONFIG = 'CONFIG',
  MUSIC = 'MUSIC',
  GAMES = 'GAMES',
}

type InteractionType<T extends ApplicationCommandType> = T extends ApplicationCommandType.ChatInput
  ? ChatInputCommandInteraction
  : T extends ApplicationCommandType.Message
  ? MessageContextMenuCommandInteraction
  : T extends ApplicationCommandType.User
  ? UserContextMenuCommandInteraction
  : never;

export class Command<T extends ApplicationCommandType = any> {
  constructor(
    public options: {
      data: RESTPostAPIApplicationCommandsJSONBody & {
        type: T;
        contexts?: Contexts[];
        integration_types?: IntegrationTypes[];
      };
      module?: ModuleType;
      cooldown?: number; // Cooldown between command executes per user (in milliseconds)
      isDeveloperOnly?: boolean; // If true, can only be used by developers
      autocomplete?({ client, interaction }: { client: DiscordClient; interaction: AutocompleteInteraction }): any;
      execute({ client, interaction }: { client: DiscordClient; interaction: InteractionType<T> }): any;
    }
  ) {}
}

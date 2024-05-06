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
      developerOnly?: boolean; // If command is for developer only, it cannot be used by anyone else
      cooldown?: number; // Cooldown between command executes per user (in milliseconds)
      data: RESTPostAPIApplicationCommandsJSONBody & {
        type: T;
        contexts?: Contexts[];
        integration_types?: IntegrationTypes[];
      };
      autocomplete?: (options: { client: DiscordClient; interaction: AutocompleteInteraction }) => any;
      execute: (options: { client: DiscordClient; interaction: InteractionType<T> }) => any;
    }
  ) {}
}

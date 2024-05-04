import { ApplicationCommandType, CommandInteraction, type ApplicationCommandDataResolvable, type AutocompleteInteraction } from 'discord.js';
import type { DiscordClient } from './client';

export enum Context {
  GUILD = 0,
  BOT_DM = 1,
  PRIVATE_CHANNEL = 2,
}

export enum IntegrationTypes {
  GUILD_INSTALL = 0,
  USER_INSTALL = 1,
}

export class Command {
  constructor(
    public options: {
      developerOnly?: boolean; // If command is for developer only, it cannot be used by anyone else
      cooldown?: number; // Cooldown between command executes per user (in milliseconds)
      data: ApplicationCommandDataResolvable & {
        type: ApplicationCommandType;
        contexts?: Context[];
        integration_types?: IntegrationTypes[];
      };
      execute: (options: { client: DiscordClient; interaction: CommandInteraction }) => any;
      autocomplete?: (options: { client: DiscordClient; interaction: AutocompleteInteraction }) => any;
    }
  ) {}
}

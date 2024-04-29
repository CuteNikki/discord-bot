import type { DiscordClient } from 'classes/client';
import type { ApplicationCommandData, ChatInputCommandInteraction, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction } from 'discord.js';

export class Command {
  constructor(
    public options: {
      developerOnly?: boolean; // If command is for developer only, it cannot be used by anyone else
      cooldown?: number; // Cooldown between command executes per user (in milliseconds)
      data: ApplicationCommandData;
      execute: (options: {
        client: DiscordClient;
        interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction;
      }) => any;
    }
  ) {}
}

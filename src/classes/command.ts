import type { DiscordClient } from 'classes/client';
import type { ChatInputApplicationCommandData, ChatInputCommandInteraction } from 'discord.js';

export class Command {
  constructor(
    public options: {
      developerOnly?: boolean; // If command is for developer only, it cannot be used by anyone else
      cooldown?: number; // Cooldown between command executes per user (in milliseconds)
      data: ChatInputApplicationCommandData;
      execute: (options: { client: DiscordClient; interaction: ChatInputCommandInteraction }) => any;
    }
  ) {}
}

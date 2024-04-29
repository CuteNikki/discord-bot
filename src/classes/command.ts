import type { DiscordClient } from 'classes/client';
import type { ApplicationCommandData, ChatInputCommandInteraction, MessageContextMenuCommandInteraction, UserContextMenuCommandInteraction } from 'discord.js';

export type CommandOptions = {
  data: ApplicationCommandData;
  developerOnly?: boolean;
  cooldown?: number;
  execute: (options: {
    client: DiscordClient;
    interaction: ChatInputCommandInteraction | MessageContextMenuCommandInteraction | UserContextMenuCommandInteraction;
  }) => any;
};

export class Command {
  options: CommandOptions;
  constructor(options: CommandOptions) {
    this.options = options;
  }
}

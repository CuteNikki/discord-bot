import { Client, Collection, CommandInteraction, SlashCommandBuilder } from 'discord.js';

export class ExtendedClient extends Client {
  commands = new Collection<string, { execute: (interaction: CommandInteraction) => unknown; data: SlashCommandBuilder }>();
}

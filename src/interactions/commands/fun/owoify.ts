import { owoify } from 'discord-actions';
import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import { Command } from 'classes/command';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Fun,
  data: new SlashCommandBuilder()
    .setName('owoify')
    .setDescription('Owoify a message')
    .addStringOption((option) => option.setName('message').setDescription('The message to owoify').setRequired(true))
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('Whether the response should be ephemeral')),
  async execute({ interaction }) {
    const message = interaction.options.getString('message') as string;
    const ephemeral = interaction.options.getBoolean('ephemeral') as boolean;

    await interaction.deferReply({ flags: ephemeral ? [MessageFlags.Ephemeral] : [] });

    const { owo } = await owoify({ text: message });
    await interaction.editReply({ content: owo });
  }
});

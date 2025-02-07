import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Fun,
  data: new SlashCommandBuilder()
    .setName('decide')
    .setDescription('Helps you decide between options')
    .addStringOption((option) => option.setName('options').setDescription('Separate each option with a semicolon (;)').setRequired(true).setMaxLength(1000))
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('Whether the response should be ephemeral').setRequired(false)),
  async execute({ client, interaction, lng }) {
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
    await interaction.deferReply({ flags: ephemeral ? [MessageFlags.Ephemeral] : undefined });

    const options = interaction.options.getString('options')?.split(';');
    if (!options) return;
    const random = Math.floor(Math.random() * options.length);

    interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.fun).setDescription(t('decide.result', { lng, result: options[random], options: options.join(', ') }))]
    });
  }
});

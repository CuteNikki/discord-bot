import { eightball } from 'discord-actions';
import { ApplicationIntegrationType, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';

import { Command } from 'classes/command';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Fun,
  data: new SlashCommandBuilder()
    .setName('eightball')
    .setDescription('Ask the magic 8ball a question')
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addStringOption((option) => option.setName('question').setDescription('The question to ask the magic 8ball').setRequired(true))
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('Whether the response should be ephemeral')),
  async execute({ interaction }) {
    const question = interaction.options.getString('question', true);
    const ephemeral = interaction.options.getBoolean('ephemeral');

    await interaction.deferReply({ flags: ephemeral ? [MessageFlags.Ephemeral] : [] });

    const { response } = await eightball({ text: question });
    await interaction.editReply({ content: response });
  }
});

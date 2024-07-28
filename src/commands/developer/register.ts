import { ApplicationIntegrationType, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

import { Command, ModuleType } from 'classes/command';

import { registerCommands } from 'loaders/commands';

export default new Command({
  module: ModuleType.Developer,
  isDeveloperOnly: true,
  cooldown: 0,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Registers commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild),
  async execute({ interaction }) {
    await interaction.deferReply();

    await registerCommands();

    await interaction.editReply('Commands have been registered!');
  },
});

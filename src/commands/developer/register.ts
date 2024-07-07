import { ApplicationCommandType, PermissionFlagsBits } from 'discord.js';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

import { registerCommands } from 'loaders/commands';

export default new Command({
  module: ModuleType.Developer,
  isDeveloperOnly: true,
  cooldown: 0,
  data: {
    name: 'register',
    description: 'Registers commands',
    default_member_permissions: `${PermissionFlagsBits.Administrator}`,
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.Guild],
    integration_types: [IntegrationTypes.GuildInstall],
  },
  async execute({ interaction, client }) {
    await interaction.deferReply();

    await registerCommands(client);

    await interaction.editReply('Commands have been registered!');
  },
});

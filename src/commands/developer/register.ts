import { ApplicationCommandType, PermissionFlagsBits } from 'discord.js';

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';

import { registerCommands } from 'loaders/commands';

export default new Command({
  module: Modules.DEVELOPER,
  developerOnly: true,
  cooldown: 0,
  data: {
    name: 'register',
    description: 'Registers commands',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
    default_member_permissions: `${PermissionFlagsBits.Administrator}`,
  },
  async execute({ interaction, client }) {
    await interaction.deferReply();

    await registerCommands(client);

    await interaction.editReply('Commands have been registered!');
  },
});

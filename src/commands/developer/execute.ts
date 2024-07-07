import { ActionRowBuilder, ApplicationCommandType, ModalBuilder, PermissionFlagsBits, TextInputBuilder, TextInputStyle } from 'discord.js';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

export default new Command({
  module: ModuleType.Developer,
  isDeveloperOnly: true,
  cooldown: 0,
  data: {
    name: 'execute',
    description: 'Executes a console command',
    default_member_permissions: `${PermissionFlagsBits.Administrator}`,
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.Guild],
    integration_types: [IntegrationTypes.GuildInstall],
  },
  async execute({ interaction }) {
    await interaction.showModal(
      new ModalBuilder()
        .setCustomId('modal_execute')
        .setTitle('Execute command')
        .setComponents(
          new ActionRowBuilder<TextInputBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId('command')
              .setLabel('command to execute')
              .setPlaceholder('cat src/classes/client.ts')
              .setMaxLength(4000)
              .setRequired(true)
              .setStyle(TextInputStyle.Paragraph)
          )
        )
    );
  },
});

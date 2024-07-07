import { ActionRowBuilder, ApplicationCommandType, ModalBuilder, PermissionFlagsBits, TextInputBuilder, TextInputStyle } from 'discord.js';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

export default new Command({
  module: ModuleType.Developer,
  isDeveloperOnly: true,
  cooldown: 0,
  data: {
    name: 'eval',
    description: 'Evaluates code',
    default_member_permissions: `${PermissionFlagsBits.Administrator}`,
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.Guild],
    integration_types: [IntegrationTypes.GuildInstall],
  },
  async execute({ interaction }) {
    await interaction.showModal(
      new ModalBuilder()
        .setCustomId('modal_eval')
        .setTitle('Evaluate code')
        .setComponents(
          new ActionRowBuilder<TextInputBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId('code')
              .setLabel('code to evaluate')
              .setPlaceholder('console.log("hello world!");')
              .setMaxLength(4000)
              .setRequired(true)
              .setStyle(TextInputStyle.Paragraph)
          ),
          new ActionRowBuilder<TextInputBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId('depth')
              .setLabel('inspect depth (numbers only)')
              .setValue('0')
              .setMaxLength(1)
              .setRequired(true)
              .setStyle(TextInputStyle.Short)
          )
        )
    );
  },
});

import { ActionRowBuilder, ApplicationCommandType, ModalBuilder, PermissionFlagsBits, TextInputBuilder, TextInputStyle } from 'discord.js';

import { Command, Contexts, IntegrationTypes } from 'classes/command';

export default new Command({
  developerOnly: true,
  cooldown: 0,
  data: {
    name: 'eval',
    description: 'Evaluates code',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
    default_member_permissions: `${PermissionFlagsBits.Administrator}`,
  },
  async execute({ interaction }) {
    await interaction.showModal(
      new ModalBuilder()
        .setCustomId('modal_eval')
        .setTitle('Evaluate code')
        .setComponents(
          new ActionRowBuilder<TextInputBuilder>().setComponents(
            new TextInputBuilder().setCustomId('code').setLabel('code').setRequired(true).setStyle(TextInputStyle.Paragraph)
          )
        )
    );
  },
});

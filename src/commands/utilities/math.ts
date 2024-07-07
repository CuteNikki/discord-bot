import { ActionRowBuilder, ApplicationCommandType, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

export default new Command({
  module: ModuleType.UTILITIES,
  data: {
    name: 'math',
    description: 'Evaluates an expression',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD, Contexts.BOT_DM, Contexts.PRIVATE_CHANNEL],
    integration_types: [IntegrationTypes.GUILD_INSTALL, IntegrationTypes.USER_INSTALL],
  },
  async execute({ interaction, client }) {
    const lng = await client.getUserLanguage(interaction.user.id);

    await interaction.showModal(
      new ModalBuilder()
        .setTitle(i18next.t('math.title', { lng }))
        .setCustomId('modal_math')
        .setComponents(
          new ActionRowBuilder<TextInputBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId('expression')
              .setLabel(i18next.t('math.input', { lng }))
              .setPlaceholder('a = 3\npi + a')
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          )
        )
    );
  },
});

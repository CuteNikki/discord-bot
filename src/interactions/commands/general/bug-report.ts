import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  EmbedBuilder,
  InteractionContextType,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { keys } from 'constants/keys';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.General,
  data: new SlashCommandBuilder()
    .setName('bug-report')
    .setDescription('Opens an input to send a bug-report to the developer.')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel),
  async execute({ client, interaction, lng }) {
    if (!keys.DEVELOPER_BUG_REPORT_WEBHOOK || keys.DEVELOPER_BUG_REPORT_WEBHOOK === 'optional') {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('bug-report.unavailable', { lng }))],
        ephemeral: true
      });
      return;
    }

    await interaction.showModal(
      new ModalBuilder()
        .setCustomId('modal-bug-report')
        .setTitle(t('bug-report.title', { lng }))
        .setComponents(
          new ActionRowBuilder<TextInputBuilder>().setComponents(
            new TextInputBuilder()
              .setCustomId('input-bug-report-description')
              .setLabel(t('bug-report.description', { lng }))
              .setMaxLength(4000)
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(true)
          )
        )
    );
  }
});

import { EmbedBuilder, WebhookClient } from 'discord.js';
import { t } from 'i18next';

import { Modal } from 'classes/modal';

import { keys } from 'constants/keys';

import { ModuleType } from 'types/interactions';
import { logger } from 'utils/logger';

export default new Modal({
  module: ModuleType.General,
  customId: 'modal-bug-report',
  async execute({ interaction, client, lng }) {
    if (!keys.DEVELOPER_BUG_REPORT_WEBHOOK || keys.DEVELOPER_BUG_REPORT_WEBHOOK === 'optional') {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('bug-report.unavailable', { lng }))], ephemeral: true });
      return;
    }

    const description = interaction.fields.getTextInputValue('input-bug-report-description');

    const webhook = new WebhookClient({ url: keys.DEVELOPER_BUG_REPORT_WEBHOOK });

    if (!webhook || !description.length) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('bug-report.unavailable', { lng }))],
        ephemeral: true
      });
      return;
    }

    await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.general).setDescription(t('bug-report.success', { lng }))], ephemeral: true });

    await webhook
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.colors.general)
            .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ size: 512 }) })
            .setDescription(description)
            .setFooter({ text: interaction.user.id })
            .setTimestamp()
        ],
        username: client.user ? `${client.user.username} | Bug-Report` : `${keys.DISCORD_BOT_ID} | Bug-Report`,
        avatarURL: client.user?.displayAvatarURL({ size: 512 })
      })
      .catch((err) => logger.debug({ err, user: interaction.user, report: description }, 'Could not send Bug-Report to webhook'));
  }
});

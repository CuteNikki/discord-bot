import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getGuildSettings } from 'db/guild';
import { ticketModel } from 'models/ticket';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-tickets-delete',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['ManageChannels', 'SendMessages'],
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { guildId, channelId, customId, user, member } = interaction;

    const currentConfig = await getGuildSettings(guildId);
    const lng = currentConfig.language;

    const system = currentConfig.ticket.systems.find((system) => system._id.toString() === customId.split('_')[1]);
    if (!system) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid_system', { lng }))],
        ephemeral: true,
      });
      return;
    }

    const ticket = await ticketModel.findOne({ channelId });

    if (!ticket) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid_ticket', { lng }))],
        ephemeral: true,
      });
      return;
    }

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      if (!member.roles.cache.has(system.staffRoleId)) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.staff_only', { lng }))],
          ephemeral: true,
        });
        return;
      }
    }

    const hasTranscriptChannel = system.transcriptChannelId ? true : false;

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.ticket)
          .setDescription(
            [
              t('ticket.ticket_deleted', { lng, deleted_by: user.toString() }),
              t('ticket.delete_time', { lng }),
              hasTranscriptChannel ? t('ticket.delete_reminder', { lng }) : '',
            ].join('\n'),
          ),
      ],
      components: hasTranscriptChannel
        ? [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`button-tickets-save_${system._id.toString()}`)
                .setLabel(t('ticket.save', { lng }))
                .setEmoji('🗂️')
                .setStyle(ButtonStyle.Success),
            ),
          ]
        : [],
    });

    setTimeout(async () => {
      const isDeleted = await interaction.channel?.delete().catch((err) => logger.debug({ err, channelId }, 'Could not delete ticket channel'));

      if (!isDeleted) {
        await interaction
          .editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.error', { lng }))] })
          .catch((err) => logger.debug({ err }, 'Could not edit reply'));
        return;
      }

      await ticketModel.deleteOne({ _id: ticket._id });
    }, 5000);
  },
});

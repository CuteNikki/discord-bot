import { createTranscript, ExportReturnType } from 'discord-html-transcripts';
import { EmbedBuilder, PermissionFlagsBits, time, TimestampStyles, userMention, type TextBasedChannel } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getGuildLanguage } from 'db/language';
import { findTicket, getTicketGroup } from 'db/ticket';

import { logger } from 'utils/logger';

import { ModuleType } from 'types/interactions';

export default new Button({
  module: ModuleType.Ticket,
  customId: 'button-tickets-save',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['SendMessages'],
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    const { guildId, customId, member, channelId } = interaction;

    const guildLng = await getGuildLanguage(guildId);

    const group = await getTicketGroup(customId.split('_')[1]);

    if (!group) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid-group', { lng }))],
        ephemeral: true
      });
      return;
    }

    const ticket = await findTicket(channelId);

    if (!ticket) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid-ticket', { lng }))],
        ephemeral: true
      });
      return;
    }

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      if (!member.roles.cache.has(group.staffRoleId)) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.staff-only', { lng }))],
          ephemeral: true
        });
        return;
      }
    }

    const transcript = await createTranscript(interaction.channel as TextBasedChannel, {
      limit: -1,
      returnType: ExportReturnType.Attachment,
      filename: 'transcript.html',
      saveImages: true,
      footerText: 'Exported {number} message{s}',
      poweredBy: false
    });

    if (!group.transcriptChannelId) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid-transcript-channel', { lng: guildLng }))],
        files: [transcript]
      });
      return;
    }

    const channel = interaction.guild.channels.cache.get(group.transcriptChannelId);

    if (!channel?.isSendable()) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid-transcript-channel', { lng: guildLng }))],
        files: [transcript]
      });
      return;
    }

    const msg = await channel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.colors.ticket)
            .setTitle(t('ticket.transcript-title', { lng: guildLng }))
            .addFields(
              {
                name: t('ticket.claimed-by', { lng: guildLng }),
                value: ticket.claimedBy ? userMention(ticket.claimedBy) : t('none', { lng: guildLng })
              },
              {
                name: t('ticket.users', { lng: guildLng }),
                value: `${ticket.users
                  .map((userId) => {
                    if (userId === ticket.createdBy) return `${userMention(userId)} (${t('ticket.creator', { lng: guildLng })})`;
                    else return userMention(userId);
                  })
                  .join(', ')}`
              },
              {
                name: t('ticket.created-for', { lng: guildLng }),
                value: ticket.choice
              },
              {
                name: t('ticket.created-at', { lng: guildLng }),
                value: time(Math.floor(ticket.createdAt / 1000), TimestampStyles.RelativeTime)
              }
            )
        ],
        files: [transcript]
      })
      .catch((err) => logger.debug({ err }, 'Could not send transcript'));

    if (!msg) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.error', { lng }))], ephemeral: true });
      return;
    }

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(client.colors.ticket).setDescription(t('ticket.saved-transcript', { lng: guildLng }))]
    });
  }
});

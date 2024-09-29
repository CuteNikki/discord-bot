import { ExportReturnType, createTranscript } from 'discord-html-transcripts';
import { EmbedBuilder, PermissionFlagsBits, type TextBasedChannel } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getGuildSettings } from 'db/guild';
import { findTicket } from 'db/ticket';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-tickets-save',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['SendMessages'],
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;

    const { guildId, customId, member, channelId } = interaction;

    const currentConfig = await getGuildSettings(guildId);
    const lng = currentConfig.language;

    const system = currentConfig.ticket.systems.find((system) => system._id.toString() === customId.split('_')[1]);

    if (!system) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid_system', { lng }))],
        ephemeral: true
      });
      return;
    }

    const ticket = await findTicket(channelId);

    if (!ticket) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid_ticket', { lng }))],
        ephemeral: true
      });
      return;
    }

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      if (!member.roles.cache.has(system.staffRoleId)) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.staff_only', { lng }))],
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

    if (!system.transcriptChannelId) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid_transcript_channel', { lng }))],
        files: [transcript]
      });
      return;
    }

    const channel = interaction.guild.channels.cache.get(system.transcriptChannelId) as TextBasedChannel;

    if (!channel?.isSendable()) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid_transcript_channel', { lng }))],
        files: [transcript]
      });
      return;
    }

    const msg = await channel
      .send({
        embeds: [
          new EmbedBuilder().setTitle(t('ticket.transcript_title', { lng })).addFields(
            {
              name: t('ticket.claimed_by', { lng }),
              value: `<@${ticket.claimedBy}>`
            },
            {
              name: t('ticket.users', { lng }),
              value: `${ticket.users
                .map((userId) => {
                  if (userId === ticket.createdBy) return `<@${userId}> (${t('ticket.creator', { lng })})`;
                  else return `<@${userId}>`;
                })
                .join(', ')}`
            },
            {
              name: t('ticket.created_for', { lng }),
              value: `${ticket.choice}`
            },
            {
              name: t('ticket.created_at', { lng }),
              value: `<t:${Math.floor(ticket.createdAt / 1000)}:R>`
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
      embeds: [new EmbedBuilder().setColor(client.colors.ticket).setDescription(t('ticket.saved_transcript', { lng }))],
      ephemeral: true
    });
  }
});

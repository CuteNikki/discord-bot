import { ExportReturnType, createTranscript } from 'discord-html-transcripts';
import { ChannelType, EmbedBuilder, type TextBasedChannel } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { ticketModel } from 'models/ticket';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-tickets-save',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['SendMessages'],
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { guildId, customId } = interaction;

    const currentConfig = await client.getGuildSettings(guildId);
    const lng = currentConfig.language;

    const system = currentConfig.ticket.systems.find((system) => system._id.toString() === customId.split('_')[1]);
    if (!system)
      return interaction.reply({
        content: t('tickets.invalid_system', { lng }),
        ephemeral: true,
      });

    if (!interaction.member.roles.cache.has(system.staffRoleId))
      return interaction.reply({
        content: t('tickets.staff_only', { lng }),
        ephemeral: true,
      });

    const transcript = await createTranscript(interaction.channel as TextBasedChannel, {
      limit: -1,
      returnType: ExportReturnType.Attachment,
      filename: 'transcript.html',
      saveImages: true,
      footerText: 'Exported {number} message{s}',
      poweredBy: false,
    });

    if (!system.transcriptChannelId)
      return interaction.reply({
        content: t('tickets.invalid_transcript_channel', { lng }),
        files: [transcript],
      });
    const channel = interaction.guild.channels.cache.get(system.transcriptChannelId) as TextBasedChannel;
    if (!channel || channel.type !== ChannelType.GuildText)
      return interaction.reply({
        content: t('tickets.invalid_transcript_channel', { lng }),
        files: [transcript],
      });

    const ticket = await ticketModel.findOne({
      channelId: interaction.channel?.id,
    });
    if (!ticket)
      return interaction.reply({
        content: t('tickets.invalid_ticket', { lng }),
        ephemeral: true,
      });

    const msg = await channel
      .send({
        embeds: [
          new EmbedBuilder().setTitle(t('tickets.transcript_title', { lng })).addFields(
            {
              name: t('tickets.claimed_by', { lng }),
              value: `<@${ticket.claimedBy}>`,
            },
            {
              name: t('tickets.users', { lng }),
              value: `${ticket.users
                .map((userId) => {
                  if (userId === ticket.createdBy) return `<@${userId}> (${t('tickets.creator', { lng })})`;
                  else return `<@${userId}>`;
                })
                .join(', ')}`,
            },
            {
              name: t('tickets.created_for', { lng }),
              value: `${ticket.choice}`,
            },
            {
              name: t('tickets.created_at', { lng }),
              value: `<t:${Math.floor(ticket.createdAt / 1000)}:R>`,
            },
          ),
        ],
        files: [transcript],
      })
      .catch((err) => logger.debug({ err }, 'Could not send transcript'));

    if (!msg) return interaction.reply({ content: t('tickets.error', { lng }) });

    await interaction.reply({
      content: t('tickets.saved_transcript', { lng }),
    });
  },
});

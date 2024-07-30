import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { ticketModel } from 'models/ticket';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-tickets-delete',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['ManageChannels', 'SendMessages'],
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { guildId, channelId, customId } = interaction;

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

    const ticket = await ticketModel.findOne({ channelId });
    if (!ticket)
      return interaction.reply({
        content: `${t('tickets.invalid_ticket', { lng })}`,
      });

    const hasTranscriptChannel = system.transcriptChannelId ? true : false;

    await interaction.reply({
      content: `${t('tickets.ticket_deleted', { lng, deleted_by: `${interaction.user}` })}\n${t('tickets.delete_time', { lng })}\n${
        hasTranscriptChannel ? t('tickets.delete_reminder', { lng }) : ''
      }`,
      components: hasTranscriptChannel
        ? [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`button-tickets-save_${system._id.toString()}`)
                .setLabel(t('tickets.save', { lng }))
                .setEmoji('🗂️')
                .setStyle(ButtonStyle.Success),
            ),
          ]
        : [],
    });

    setTimeout(async () => {
      const isDeleted = await interaction.channel?.delete().catch((err) => logger.debug({ err, channelId }, 'Could not delete ticket channel'));
      if (!isDeleted) return interaction.editReply({ content: t('tickets.error', { lng }) });
      await ticketModel.deleteOne({ _id: ticket._id });
    }, 5000);
  },
});

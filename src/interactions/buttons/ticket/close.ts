import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, PermissionFlagsBits, TextChannel } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getGuildLanguage } from 'db/language';
import { closeTicket, findTicket, getTicketGroup } from 'db/ticket';

import { logger } from 'utils/logger';

import { ModuleType } from 'types/interactions';

export default new Button({
  module: ModuleType.Ticket,
  customId: 'button-tickets-close',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['ManageChannels', 'SendMessages'],
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    const { user, guildId, channelId, customId, member } = interaction;

    const guildLng = await getGuildLanguage(guildId);

    const group = await getTicketGroup(customId.split('_')[1]);

    if (!group) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid-group', { lng }))],
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    const ticket = await findTicket(channelId);

    if (!ticket) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid-ticket', { lng }))],
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
      if (!member.roles.cache.has(group.staffRoleId)) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.staff-only', { lng }))],
          flags: [MessageFlags.Ephemeral]
        });
        return;
      }

      if (!ticket.claimedBy) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.not-claimed', { lng }))],
          flags: [MessageFlags.Ephemeral]
        });
        return;
      }
    }

    const hasTranscriptChannel = group.transcriptChannelId ? true : false;

    if (ticket.closed) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.already-closed', { lng: guildLng }))],
        components: hasTranscriptChannel
          ? [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId(`button-tickets-save_${group._id.toString()}`)
                  .setLabel(t('ticket.save', { lng: guildLng }))
                  .setEmoji('💾')
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId(`button-tickets-delete_${group._id.toString()}`)
                  .setLabel(t('ticket.delete', { lng: guildLng }))
                  .setEmoji('🗑️')
                  .setStyle(ButtonStyle.Danger)
              )
            ]
          : [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId(`button-tickets-delete_${group._id.toString()}`)
                  .setLabel(t('ticket.delete', { lng: guildLng }))
                  .setEmoji('🗑️')
                  .setStyle(ButtonStyle.Danger)
              )
            ]
      });
      return;
    }

    const channel = interaction.channel as TextChannel;

    for (const userId of ticket.users) {
      const overwrite = await channel.permissionOverwrites
        .edit(userId, { ViewChannel: false, SendMessages: false })
        .catch((err) => logger.debug({ err, userId }, 'Could not edit channel permissions'));

      if (!overwrite) {
        continue;
      }
    }

    await closeTicket(channelId);

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(client.colors.ticket).setDescription(t('ticket.closed', { lng: guildLng, closedBy: user.toString() }))],
      components: hasTranscriptChannel
        ? [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`button-tickets-save_${group._id.toString()}`)
                .setLabel(t('ticket.save', { lng: guildLng }))
                .setEmoji('🗂️')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`button-tickets-delete_${group._id.toString()}`)
                .setLabel(t('ticket.delete', { lng: guildLng }))
                .setEmoji('✖️')
                .setStyle(ButtonStyle.Danger)
            )
          ]
        : [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`button-tickets-delete_${group._id.toString()}`)
                .setLabel(t('ticket.delete', { lng: guildLng }))
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Danger)
            )
          ]
    });
  }
});

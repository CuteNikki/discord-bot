import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, PermissionFlagsBits, TextChannel } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getGuildLanguage } from 'db/language';
import { findTicket, getTicketGroup, unlockTicket } from 'db/ticket';

import { logger } from 'utils/logger';

import { ModuleType } from 'types/interactions';

export default new Button({
  module: ModuleType.Ticket,
  customId: 'button-tickets-unlock',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['ManageChannels', 'SendMessages'],
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    const { guildId, customId, user, member, channelId } = interaction;

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

    if (ticket.closed) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.already-closed', { lng }))],
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    if (!ticket.locked) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.already-unlocked', { lng }))],
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    const channel = interaction.channel as TextChannel;

    for (const userId of ticket.users) {
      const overwrite = await channel.permissionOverwrites
        .edit(userId, { SendMessages: true })
        .catch((err) => logger.debug({ err, userId }, 'Could not edit channel permissions'));

      if (!overwrite) {
        continue;
      }
    }

    await unlockTicket(channelId);

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(client.colors.ticket).setDescription(t('ticket.unlocked', { lng: guildLng, unlockedBy: user.toString() }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`button-tickets-lock_${group._id.toString()}`)
            .setLabel(t('ticket.lock', { lng: guildLng }))
            .setEmoji('🔐')
            .setStyle(ButtonStyle.Primary)
        )
      ]
    });
  }
});

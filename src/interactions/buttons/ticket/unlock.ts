import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, TextChannel } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getGuildSettings } from 'db/guild';
import { findTicket, unlockTicket } from 'db/ticket';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-tickets-unlock',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['ManageChannels', 'SendMessages'],
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    const { guildId, customId, user, member, channelId } = interaction;

    const currentConfig = await getGuildSettings(guildId);

    const guildLng = currentConfig.language;

    const system = currentConfig.ticket.systems.find((system) => system._id.toString() === customId.split('_')[1]);

    if (!system) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid-system', { lng }))],
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
      if (!member.roles.cache.has(system.staffRoleId)) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.staff-only', { lng }))],
          ephemeral: true
        });
        return;
      }

      if (!ticket.claimedBy) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.not-claimed', { lng }))],
          ephemeral: true
        });
        return;
      }
    }

    if (ticket.closed) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.already-closed', { lng }))],
        ephemeral: true
      });
      return;
    }

    if (!ticket.locked) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.already-unlocked', { lng }))],
        ephemeral: true
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
            .setCustomId(`button-tickets-lock_${system._id.toString()}`)
            .setLabel(t('ticket.lock', { lng: guildLng }))
            .setEmoji('🔐')
            .setStyle(ButtonStyle.Primary)
        )
      ]
    });
  }
});

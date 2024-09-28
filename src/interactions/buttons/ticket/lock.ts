import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, TextChannel } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getGuildSettings } from 'db/guild';
import { findTicket, lockTicket } from 'db/ticket';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-tickets-lock',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['ManageChannels', 'SendMessages'],
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { user, guildId, channelId, customId, member } = interaction;

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

    const ticket = await findTicket(channelId);

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

      if (!ticket.claimedBy) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.not_claimed', { lng }))],
          ephemeral: true,
        });
        return;
      }
    }

    if (ticket.closed) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.already_closed', { lng }))],
        ephemeral: true,
      });
      return;
    }

    if (ticket.locked) {
      await interaction.reply({
        content: t('ticket.already_locked', { lng }),
        ephemeral: true,
      });
      return;
    }

    const channel = interaction.channel as TextChannel;

    for (const userId of ticket.users) {
      const overwrite = await channel.permissionOverwrites
        .edit(userId, { SendMessages: false })
        .catch((err) => logger.debug({ err, userId }, 'Could not edit channel permissions'));
      if (!overwrite) {
        interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.error', { lng }))], ephemeral: true });
        break;
      }
    }

    await lockTicket(channelId);

    await interaction.reply({
      embeds: [new EmbedBuilder().setColor(client.colors.ticket).setDescription(t('ticket.locked', { lng, locked_by: user.toString() }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`button-tickets-unlock_${system._id.toString()}`)
            .setLabel(t('ticket.unlock', { lng }))
            .setEmoji('🔓')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`button-tickets-close_${system._id.toString()}`)
            .setLabel(t('ticket.close', { lng }))
            .setEmoji('🛑')
            .setStyle(ButtonStyle.Danger),
        ),
      ],
    });
  },
});

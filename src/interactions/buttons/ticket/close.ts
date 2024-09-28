import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, TextChannel } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getGuildSettings } from 'db/guild';
import { closeTicket, findTicket } from 'db/ticket';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-tickets-close',
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

    const hasTranscriptChannel = system.transcriptChannelId ? true : false;

    if (ticket.closed) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.already_closed', { lng }))],
        components: hasTranscriptChannel
          ? [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId(`button-tickets-save_${system._id.toString()}`)
                  .setLabel(t('ticket.save', { lng }))
                  .setEmoji('💾')
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId(`button-tickets-delete_${system._id.toString()}`)
                  .setLabel(t('ticket.delete', { lng }))
                  .setEmoji('🗑️')
                  .setStyle(ButtonStyle.Danger),
              ),
            ]
          : [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId(`button-tickets-delete_${system._id.toString()}`)
                  .setLabel(t('ticket.delete', { lng }))
                  .setEmoji('🗑️')
                  .setStyle(ButtonStyle.Danger),
              ),
            ],
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
      embeds: [new EmbedBuilder().setColor(client.colors.ticket).setDescription(t('ticket.closed', { lng, closed_by: `${user.toString()}` }))],
      components: hasTranscriptChannel
        ? [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`button-tickets-save_${system._id.toString()}`)
                .setLabel(t('ticket.save', { lng }))
                .setEmoji('🗂️')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`button-tickets-delete_${system._id.toString()}`)
                .setLabel(t('ticket.delete', { lng }))
                .setEmoji('✖️')
                .setStyle(ButtonStyle.Danger),
            ),
          ]
        : [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`button-tickets-delete_${system._id.toString()}`)
                .setLabel(t('ticket.delete', { lng }))
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Danger),
            ),
          ],
    });
  },
});

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, PermissionFlagsBits, TextChannel, UserSelectMenuBuilder } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getGuildLanguage } from 'db/language';
import { createTicket, deleteTicketById, getTicketConfig, getTicketGroup, getTicketsByUser } from 'db/ticket';

import { logger } from 'utils/logger';

import { ModuleType } from 'types/interactions';

export default new Button({
  module: ModuleType.Ticket,
  customId: 'button-tickets-create',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['ManageChannels', 'SendMessages'],
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const { user, guildId, customId, guild } = interaction;
    const choiceIndex = parseInt(customId.split('_')[2]);

    const config = await getTicketConfig(guildId);

    if (!config?.enabled) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.create-disabled', { lng }))] });
      return;
    }

    const guildLng = await getGuildLanguage(guildId);

    const group = await getTicketGroup(customId.split('_')[1]);

    if (!group) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid-group', { lng }))]
      });
      return;
    }

    let tickets = await getTicketsByUser(guildId, user.id);

    for (const ticket of tickets) {
      if (!guild.channels.cache.get(ticket.channelId)) {
        await deleteTicketById(ticket._id);

        tickets = tickets.filter((t) => t._id !== ticket._id);
      }
    }

    if (tickets.length >= group.maxTickets) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.limit', { lng, limit: group.maxTickets.toString() }))]
      });
      return;
    }

    const choice = group.choices[choiceIndex];

    if (!group.choices.length || !choice) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid-option', { lng }))]
      });
      return;
    }

    const channel: void | TextChannel = await guild.channels
      .create({
        name: `${user.username}-${choice.label}`,
        type: ChannelType.GuildText,
        parent: group.parentChannelId,
        permissionOverwrites: [
          {
            id: guildId,
            type: 0,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: group.staffRoleId,
            type: 0,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles]
          },
          {
            id: user.id,
            type: 1,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles]
          },
          {
            id: interaction.client.user.id,
            type: 1,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles]
          }
        ]
      })
      .catch((err) => logger.debug({ err }, 'Could not create ticket channel'));

    if (!channel) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.error', { lng }))] });
      return;
    }

    await createTicket(guildId, channel.id, user.id, [user.id], choice.label);

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.ticket).setDescription(t('ticket.created-user', { lng, channel: channel.toString() }))]
    });

    await channel
      .send({
        content: `${interaction.user} | <@&${group.staffRoleId}>`,
        embeds: [
          new EmbedBuilder().setColor(client.colors.ticket).setDescription(`${t('ticket.created-channel', { lng: guildLng, createdBy: user.toString() })}`)
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`button-tickets-claim_${group._id.toString()}`)
              .setLabel(t('ticket.claim', { lng: guildLng }))
              .setEmoji('✋')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`button-tickets-close_${group._id.toString()}`)
              .setLabel(t('ticket.close', { lng: guildLng }))
              .setEmoji('🛑')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId(`button-tickets-lock_${group._id.toString()}`)
              .setLabel(t('ticket.lock', { lng: guildLng }))
              .setEmoji('🔐')
              .setStyle(ButtonStyle.Primary)
          ),
          new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId(`selection-tickets-user_${group._id.toString()}`)
              .setPlaceholder(t('ticket.user-select', { lng: guildLng }))
              .setMaxValues(1)
          )
        ]
      })
      .catch((err) => logger.debug({ err }, 'Could not send ticket channel'));
  }
});

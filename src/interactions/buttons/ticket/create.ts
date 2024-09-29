import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, PermissionFlagsBits, TextChannel, UserSelectMenuBuilder } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getGuildSettings } from 'db/guild';
import { createTicket, deleteTicketById, getTicketsByUser } from 'db/ticket';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-tickets-create',
  isCustomIdIncluded: true,
  permissions: [],
  botPermissions: ['ManageChannels', 'SendMessages'],
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply({ ephemeral: true });

    const { user, guildId, customId, guild } = interaction;
    const choiceIndex = parseInt(customId.split('_')[2]);

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

    let tickets = await getTicketsByUser(guildId, user.id);

    for (const ticket of tickets) {
      if (!guild.channels.cache.get(ticket.channelId)) {
        await deleteTicketById(ticket._id);

        tickets = tickets.filter((t) => t._id !== ticket._id);
      }
    }

    if (tickets.length >= system.maxTickets) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.limit', { lng, limit: system.maxTickets.toString() }))]
      });
      return;
    }

    const choice = system.choices[choiceIndex];

    if (!system.choices.length || !choice) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('ticket.invalid_option', { lng }))]
      });
      return;
    }

    const channel: void | TextChannel = await guild.channels
      .create({
        name: `${user.username}-${choice.label}`,
        type: ChannelType.GuildText,
        parent: system.parentChannelId,
        permissionOverwrites: [
          {
            id: guildId,
            type: 0,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: system.staffRoleId,
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
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
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
      embeds: [new EmbedBuilder().setColor(client.colors.ticket).setDescription(t('ticket.created_user', { lng, channel: channel.toString() }))]
    });

    await channel.send({
      content: `${interaction.user} | <@&${system.staffRoleId}>`,
      embeds: [new EmbedBuilder().setColor(client.colors.ticket).setDescription(`${t('ticket.created_channel', { lng, created_by: user.toString() })}`)],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`button-tickets-claim_${system._id.toString()}`)
            .setLabel(t('ticket.claim', { lng }))
            .setEmoji('✋')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`button-tickets-close_${system._id.toString()}`)
            .setLabel(t('ticket.close', { lng }))
            .setEmoji('🛑')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`button-tickets-lock_${system._id.toString()}`)
            .setLabel(t('ticket.lock', { lng }))
            .setEmoji('🔐')
            .setStyle(ButtonStyle.Primary)
        ),
        new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
          new UserSelectMenuBuilder()
            .setCustomId(`selection-tickets-user_${system._id.toString()}`)
            .setPlaceholder(t('ticket.user_select', { lng }))
            .setMaxValues(1)
        )
      ]
    });
  }
});

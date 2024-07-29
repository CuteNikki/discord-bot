import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, PermissionFlagsBits, TextChannel, UserSelectMenuBuilder } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { ticketModel } from 'models/ticket';

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

    const currentConfig = await client.getGuildSettings(guildId);
    const lng = currentConfig.language;

    const system = currentConfig.ticket.systems.find((system) => system._id.toString() === customId.split('_')[1]);
    if (!system)
      return interaction.reply({
        content: t('tickets.invalid_system', { lng }),
        ephemeral: true,
      });

    let createdTickets = await ticketModel.find({
      guildId,
      createdBy: user.id,
    });
    for (const createdTicket of createdTickets.filter((ticket) => !ticket.closed)) {
      if (!guild.channels.cache.get(createdTicket.channelId)) {
        await ticketModel.deleteOne({ _id: createdTicket._id });
        createdTickets = createdTickets.filter((ticket) => ticket.channelId !== createdTicket.channelId);
      }
    }
    if (createdTickets.length >= system.maxTickets)
      return interaction.editReply({
        content: t('tickets.limit', { lng, limit: system.maxTickets }),
      });

    const choice = system.choices[choiceIndex];

    if (!system.choices.length || !choice)
      return interaction.editReply({
        content: t('tickets.invalid_option', { lng }),
      });

    const channel: void | TextChannel = await interaction.guild.channels
      .create({
        name: `${user.username}-${choice}`,
        type: ChannelType.GuildText,
        parent: system.parentChannelId,
        permissionOverwrites: [
          {
            id: interaction.guildId,
            type: 0,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: system.staffRoleId,
            type: 0,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles],
          },
          {
            id: interaction.user.id,
            type: 1,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles],
          },
          {
            id: interaction.client.user.id,
            type: 1,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
        ],
      })
      .catch((error) => logger.debug({ error }, 'Could not create ticket channel'));
    if (!channel) return interaction.editReply({ content: t('tickets.error', { lng }) });

    await ticketModel.create({
      channelId: channel.id,
      guildId: interaction.guildId,
      createdBy: interaction.user.id,
      users: [interaction.user.id],
      choice,
    });
    await interaction.editReply({
      content: t('tickets.created_user', {
        lng,
        channel: `${channel.toString()}`,
      }),
    });
    await channel.send({
      content: `${interaction.user} | <@&${system.staffRoleId}>`,
      embeds: [new EmbedBuilder().setDescription(`${t('tickets.created_channel', { lng, created_by: `${interaction.user}` })}`)],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`button-tickets-claim_${system._id.toString()}`)
            .setLabel(t('tickets.claim', { lng }))
            .setEmoji('✋')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`button-tickets-close_${system._id.toString()}`)
            .setLabel(t('tickets.close', { lng }))
            .setEmoji('🛑')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`button-tickets-lock_${system._id.toString()}`)
            .setLabel(t('tickets.lock', { lng }))
            .setEmoji('🔐')
            .setStyle(ButtonStyle.Primary),
        ),
        new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
          new UserSelectMenuBuilder()
            .setCustomId(`selection-tickets-user_${system._id.toString()}`)
            .setPlaceholder(t('tickets.user_select', { lng }))
            .setMaxValues(1),
        ),
      ],
    });
  },
});

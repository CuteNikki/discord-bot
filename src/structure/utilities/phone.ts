import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type SendableChannels
} from 'discord.js';
import { t } from 'i18next';

import {
  addAvailableChannel,
  createConnection,
  deleteConnectionById,
  findAvailableChannel,
  findConnection,
  findConnectionById,
  getAvailableChannels,
  isPhoneConnected,
  isPhoneSearching,
  removeAvailableChannel,
  removeAvailableChannelById
} from 'db/phone';
import { getUserLanguage } from 'db/user';

import { type ConnectionDocument } from 'types/phone';

import type { DiscordClient } from 'classes/client';

import { logger } from 'utils/logger';

/**
 * Handles the connection of a user to a phone
 * @param {object} { client, interaction }
 * @returns Does not return anything
 */
export async function handlePhoneConnection({ client, interaction }: { client: DiscordClient; interaction: ChatInputCommandInteraction | ButtonInteraction }) {
  await interaction.deferReply();

  const { user, channelId } = interaction;
  const lng = await getUserLanguage(user.id);

  if (await isPhoneConnected(channelId)) {
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('phone.connect.already', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-disconnect').setStyle(ButtonStyle.Danger).setLabel(t('phone.disconnect', { lng }))
        )
      ]
    });
  }

  if (await isPhoneSearching(channelId)) {
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('phone.connect.already', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-disconnect').setStyle(ButtonStyle.Danger).setLabel(t('phone.disconnect', { lng }))
        )
      ]
    });
  }

  const searchingChannels = await getAvailableChannels(channelId, user.id);

  if (!searchingChannels.length) {
    // No available channels, add this channel to the pool
    await addAvailableChannel(channelId, user.id);
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.phone).setDescription(t('phone.connect.waiting', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-disconnect').setStyle(ButtonStyle.Danger).setLabel(t('phone.disconnect', { lng }))
        )
      ]
    });
  }

  // Get an available channel
  const random = searchingChannels[Math.floor(Math.random() * searchingChannels.length)];

  // Remove channel from pool
  await removeAvailableChannel(random.channelId);

  // Establish the connection
  await createConnection(channelId, user.id, random.channelId, random.userId);

  const otherLng = await getUserLanguage(random.userId);

  try {
    const targetChannel = await client.channels
      .fetch(random.channelId)
      .catch((err) => logger.debug({ err, targetChannelId: random.channelId }, 'Could not fetch target channel'));
    if (targetChannel?.isSendable()) {
      targetChannel.send({
        embeds: [new EmbedBuilder().setColor(client.colors.phone).setDescription(t('phone.connect.connected', { lng: otherLng }))],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('button-phone-disconnect')
              .setStyle(ButtonStyle.Danger)
              .setLabel(t('phone.disconnect', { lng: otherLng }))
          )
        ]
      });
    }
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.phone).setDescription(t('phone.connect.connected', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-disconnect').setStyle(ButtonStyle.Danger).setLabel(t('phone.disconnect', { lng }))
        )
      ]
    });
  } catch (err) {
    logger.debug(err, 'Could not connect to channel');

    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.warning).setDescription(t('phone.connect.error', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-disconnect').setStyle(ButtonStyle.Danger).setLabel(t('phone.disconnect', { lng }))
        )
      ]
    });
  }
}

/**
 * Handles the disconnection of a user from a phone
 * @param {{ client: DiscordClient; interaction: ChatInputCommandInteraction | ButtonInteraction }} { client, interaction }
 * @returns Does not return anything
 */
export async function handlePhoneDisconnect({ client, interaction }: { client: DiscordClient; interaction: ChatInputCommandInteraction | ButtonInteraction }) {
  await interaction.deferReply();

  const { user, channelId } = interaction;
  const lng = await getUserLanguage(user.id);

  const availableChannel = await findAvailableChannel(channelId);
  if (availableChannel) {
    await removeAvailableChannelById(availableChannel._id);

    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.phone).setDescription(t('phone.hangup.disconnecting', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-connect').setStyle(ButtonStyle.Success).setLabel(t('phone.reconnect', { lng }))
        )
      ]
    });
  }

  const existingConnection = await findConnection(channelId);
  if (!existingConnection) {
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('phone.hangup.none', { lng }))] });
  }

  // Find the connected channel and user ids
  const connectedChannelId = existingConnection.channelIdOne === channelId ? existingConnection.channelIdTwo : existingConnection.channelIdOne;
  const otherLng = await getUserLanguage(existingConnection.userIdOne === user.id ? existingConnection.userIdTwo : existingConnection.userIdOne);

  // Remove the connection
  await deleteConnectionById(existingConnection._id);

  // Inform the other channel
  try {
    const targetChannel = await client.channels
      .fetch(connectedChannelId)
      .catch((err) => logger.debug({ err, targetChannelId: connectedChannelId }, 'Could not fetch target channel'));
    if (targetChannel?.isSendable()) {
      targetChannel.send({
        embeds: [new EmbedBuilder().setColor(client.colors.phone).setDescription(t('phone.hangup.disconnected', { lng: otherLng }))],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('button-phone-connect')
              .setStyle(ButtonStyle.Success)
              .setLabel(t('phone.reconnect', { lng: otherLng }))
          )
        ]
      });
    }
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.phone).setDescription(t('phone.hangup.disconnecting', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-connect').setStyle(ButtonStyle.Success).setLabel(t('phone.reconnect', { lng }))
        )
      ]
    });
  } catch (err) {
    logger.debug(err, 'Could not disconnect from channel');

    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.warning).setDescription(t('phone.hangup.error', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-connect').setStyle(ButtonStyle.Success).setLabel(t('phone.reconnect', { lng }))
        )
      ]
    });
  }
}

/**
 * Handles the timeout of a phone conversation
 * @param {{
 *          channel: SendableChannels;
 *          targetChannel: SendableChannels;
 *          existingConnection: Connection;
 *          timeout: number;
 *          lng: string;
 *          otherLng: string;
 *        }}
 *        { channel, targetChannel, existingConnection, timeout, lng, otherLng }
 * @returns Does not return anything
 */
export async function handlePhoneMessageTimeout({
  channel,
  targetChannel,
  existingConnection,
  timeout,
  lng,
  otherLng
}: {
  channel: SendableChannels;
  targetChannel: SendableChannels;
  existingConnection: ConnectionDocument;
  timeout: number;
  lng: string;
  otherLng: string;
}) {
  const connection = await findConnectionById(existingConnection._id);

  if (connection?.lastMessageAt && connection.lastMessageAt < Date.now() - timeout) {
    await deleteConnectionById(connection._id);

    await channel
      .send({
        content: t('phone.lost', { lng }),
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('button-phone-connect').setStyle(ButtonStyle.Success).setLabel(t('phone.reconnect', { lng }))
          )
        ]
      })
      .catch((err) => logger.debug({ err, channelId: channel.id }, 'Could not send message'));
    await targetChannel
      .send({
        content: t('phone.lost', { lng: otherLng }),
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId('button-phone-connect')
              .setStyle(ButtonStyle.Success)
              .setLabel(t('phone.reconnect', { lng: otherLng }))
          )
        ]
      })
      .catch((err) => logger.debug({ err, channelId: targetChannel.id }, 'Could not send message'));
  }
}

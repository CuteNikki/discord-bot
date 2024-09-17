import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type SendableChannels,
} from 'discord.js';
import { t } from 'i18next';

import { availableChannelModel, connectionModel, type Connection } from 'models/phone';

import type { DiscordClient } from 'classes/client';
import { getUserLanguage } from 'db/user';
import { logger } from 'utils/logger';

/**
 * Checks if a channel is already connected to a phone
 * @param {string} channelId Channel ID to check
 * @returns {Promise<boolean>} True if the channel is already connected, false otherwise
 */
async function isAlreadyConnected(channelId: string): Promise<boolean> {
  const connection = await connectionModel
    .findOne({ $or: [{ channelIdOne: channelId }, { channelIdTwo: channelId }] })
    .lean()
    .exec();
  if (connection) return true;
  return false;
}

/**
 * Checks if a channel is already searching for a connection
 * @param {string} channelId Channel ID to check
 * @returns {Promise<boolean>} True if the channel is already searching, false otherwise
 */
async function isAlreadySearching(channelId: string): Promise<boolean> {
  const channel = await availableChannelModel.findOne({ channelId }).lean().exec();
  if (channel) return true;
  return false;
}

/**
 * Handles the connection of a user to a phone
 * @param {object} { client, interaction }
 * @returns Does not return anything
 */
export async function handlePhoneConnection({ client, interaction }: { client: DiscordClient; interaction: ChatInputCommandInteraction | ButtonInteraction }) {
  await interaction.deferReply();

  const { user, channelId } = interaction;
  const lng = await getUserLanguage(user.id);

  if (await isAlreadyConnected(channelId)) {
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('phone.connect.already', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-disconnect').setStyle(ButtonStyle.Danger).setLabel(t('phone.disconnect', { lng })),
        ),
      ],
    });
  }

  if (await isAlreadySearching(channelId)) {
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('phone.connect.already', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-disconnect').setStyle(ButtonStyle.Danger).setLabel(t('phone.disconnect', { lng })),
        ),
      ],
    });
  }

  const searchingChannels = await availableChannelModel
    .find({ channelId: { $ne: channelId }, userId: { $ne: user.id } })
    .lean()
    .exec();

  if (!searchingChannels.length) {
    // No available channels, add this channel to the pool
    await availableChannelModel.create({ channelId, userId: user.id });
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.phone).setDescription(t('phone.connect.waiting', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-disconnect').setStyle(ButtonStyle.Danger).setLabel(t('phone.disconnect', { lng })),
        ),
      ],
    });
  }

  // Get an available channel
  const random = searchingChannels[Math.floor(Math.random() * searchingChannels.length)];

  // Remove channel from pool
  await availableChannelModel.deleteOne({ channelId: random.channelId }).lean().exec();

  // Establish the connection
  await connectionModel.create({
    channelIdOne: channelId,
    userIdOne: user.id,
    channelIdTwo: random.channelId,
    userIdTwo: random.userId,
  });

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
              .setLabel(t('phone.disconnect', { lng: otherLng })),
          ),
        ],
      });
    }
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.phone).setDescription(t('phone.connect.connected', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-disconnect').setStyle(ButtonStyle.Danger).setLabel(t('phone.disconnect', { lng })),
        ),
      ],
    });
  } catch (err) {
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.warning).setDescription(t('phone.connect.error', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-disconnect').setStyle(ButtonStyle.Danger).setLabel(t('phone.disconnect', { lng })),
        ),
      ],
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

  const availableChannel = await availableChannelModel.findOne({ channelId }).lean().exec();
  if (availableChannel) {
    await availableChannelModel.findByIdAndDelete(availableChannel._id);
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.phone).setDescription(t('phone.hangup.disconnecting', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-connect').setStyle(ButtonStyle.Success).setLabel(t('phone.reconnect', { lng })),
        ),
      ],
    });
  }

  const existingConnection = await connectionModel
    .findOne({
      $or: [{ channelIdOne: channelId }, { channelIdTwo: channelId }],
    })
    .lean()
    .exec();
  if (!existingConnection) {
    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('phone.hangup.none', { lng }))] });
  }

  // Find the connected channel and user ids
  const connectedChannelId = existingConnection.channelIdOne === channelId ? existingConnection.channelIdTwo : existingConnection.channelIdOne;
  const otherLng = await getUserLanguage(existingConnection.userIdOne === user.id ? existingConnection.userIdTwo : existingConnection.userIdOne);

  // Remove the connection
  await connectionModel.deleteOne({ _id: existingConnection._id });

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
              .setLabel(t('phone.reconnect', { lng: otherLng })),
          ),
        ],
      });
    }
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.phone).setDescription(t('phone.hangup.disconnecting', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-connect').setStyle(ButtonStyle.Success).setLabel(t('phone.reconnect', { lng })),
        ),
      ],
    });
  } catch (err) {
    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.warning).setDescription(t('phone.hangup.error', { lng }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('button-phone-connect').setStyle(ButtonStyle.Success).setLabel(t('phone.reconnect', { lng })),
        ),
      ],
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
  otherLng,
}: {
  channel: SendableChannels;
  targetChannel: SendableChannels;
  existingConnection: Connection;
  timeout: number;
  lng: string;
  otherLng: string;
}) {
  const connection = await connectionModel.findOne({ _id: existingConnection._id }).lean().exec();

  if (connection?.lastMessageAt && connection.lastMessageAt < Date.now() - timeout) {
    await connectionModel.deleteOne({ _id: connection._id });
    await channel
      .send({
        content: t('phone.lost', { lng }),
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('button-phone-connect').setStyle(ButtonStyle.Success).setLabel(t('phone.reconnect', { lng })),
          ),
        ],
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
              .setLabel(t('phone.reconnect', { lng: otherLng })),
          ),
        ],
      })
      .catch((err) => logger.debug({ err, channelId: targetChannel.id }, 'Could not send message'));
  }
}

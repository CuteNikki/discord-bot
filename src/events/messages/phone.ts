import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

import { connectionModel } from 'models/phone';

export default new Event({
  name: Events.MessageCreate,
  once: false,
  async execute(client, message) {
    // Destructure required properties from the message
    const { guildId, channelId, channel, author, guild } = message;
    // Ignore bot messages and messages from invalid channels or guilds
    if (author.bot || !guild || !guildId || !channelId || !channel || !message.content) return;

    // Find an existing connection for the current channel
    const existingConnection = await connectionModel
      .findOne({
        $or: [{ channelIdOne: channelId }, { channelIdTwo: channelId }],
      })
      .lean()
      .exec();
    if (!existingConnection) return;

    const lng = await client.getUserLanguage(author.id);
    const otherLng = await client.getUserLanguage(existingConnection.userIdOne === author.id ? existingConnection.userIdTwo : existingConnection.userIdOne);

    // Check if the message is too long and shorten it
    if (message.content.length > 2000) message.content = message.content.slice(0, 2000) + '...';

    // Create an embed with the message content
    const embed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
      .setDescription(message.content)
      .setTimestamp();
    const otherEmbed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setAuthor({ name: author.username, iconURL: author.displayAvatarURL() })
      .setDescription(message.content)
      .setTimestamp();

    // Define a regex for detecting links
    const linkRegex =
      /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
    // Replace message content if it contains a link
    if (linkRegex.test(message.content))
      embed.setFooter({
        text: `||${message.content}||\n\n-# ⚠️ *${t('phone.link', {
          lng,
        })}*`,
      });
    otherEmbed.setFooter({
      text: `||${message.content}||\n\n-# ⚠️ *${t('phone.link', {
        otherLng,
      })}*`,
    });

    // Check for profanity using an external API
    const res = await fetch('https://vector.profanity.dev', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message.content }),
    }).catch((err) => logger.debug({ err }, 'Could not fetch profanity API'));
    if (res) {
      const response: { isProfanity: boolean; score: number } = await res.json();
      // Replace message content if it contains profanity
      if (response.isProfanity) {
        embed.setFooter({
          text: `||${message.content}||\n\n-# ⚠️ *${t('phone.profanity', {
            lng,
          })}*`,
        });
        otherEmbed.setFooter({
          text: `||${message.content}||\n\n-# ⚠️ *${t('phone.profanity', {
            otherLng,
          })}*`,
        });
      }
    }

    // Determine the connected channel ID
    const connectedChannelId = existingConnection.channelIdOne === message.channel.id ? existingConnection.channelIdTwo : existingConnection.channelIdOne;

    // Fetch the target channel
    const targetChannel = await client.channels
      .fetch(connectedChannelId)
      .catch((err) => logger.debug({ err, channelId: connectedChannelId }, 'Could not fetch channel'));
    // Ensure the target channel is a text channel
    if (!targetChannel || targetChannel.type !== ChannelType.GuildText) return;

    // Send the embed to current channel if message can be deleted
    if (message.deletable)
      await message
        .delete()
        .catch((err) => logger.debug({ err, messageId: message.id }, 'Could not delete message'))
        .then(async () => {
          await channel.send({ embeds: [embed] }).catch((err) => logger.debug({ err, channelId: channel.id }, 'Could not send message'));
        });
    // Send the embed to the target channel
    await targetChannel.send({ embeds: [otherEmbed] }).catch((err) => logger.debug({ err, channelId: targetChannel.id }, 'Could not send message'));
  },
});

import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getUserLanguage } from 'db/language';
import { findConnection, updateLastMessageAt } from 'db/phone';

import { logger } from 'utils/logger';
import { handlePhoneMessageTimeout } from 'utils/phone';

export default new Event({
  name: Events.MessageCreate,
  once: false,
  async execute(client, message) {
    if (!message.channel || !message.content || !message.author || message.author.bot) return;

    // Destructure required properties from the message
    const { channelId, channel, author } = message;

    // Find an existing connection for the current channel
    const existingConnection = await findConnection(channelId);
    if (!existingConnection) return;

    const lng = await getUserLanguage(author.id);
    const otherLng = await getUserLanguage(existingConnection.userIdOne === author.id ? existingConnection.userIdTwo : existingConnection.userIdOne);

    // Check if the message is too long and shorten it
    if (message.content.length > 4000) message.content = message.content.slice(0, 4000) + '...';

    // Create an embed with the message content
    const embed = new EmbedBuilder()
      .setColor(Colors.Aqua)
      .setAuthor({
        name: author.globalName ? `${author.globalName} (@${author.username})` : `${author.username}`,
        iconURL: author.displayAvatarURL({ extension: 'webp', size: 256 })
      })
      .setDescription(message.content)
      .setTimestamp();
    const otherEmbed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setAuthor({
        name: author.globalName ? `${author.globalName} (@${author.username})` : `${author.username}`,
        iconURL: author.displayAvatarURL({ extension: 'webp', size: 256 })
      })
      .setDescription(message.content)
      .setTimestamp();

    const linkRegex =
      /(?:https?:\/\/|www\.)[\w-]+\.\w{2,}(\/\S*)?|\b[\w-]+\.(?:com|net|org|xyz|moe|edu|gov|info|io|tech|ai|biz|co|me|dev|tv|cc|app|uk|us|ca|eu|fr|de|jp|cn)\b/gm;
    // Replace message content if it contains a link
    if (linkRegex.test(message.content)) {
      embed.setDescription(`||${message.content}||`).setFooter({
        text: `⚠️ ${t('phone.link', {
          lng
        })}`
      });

      otherEmbed.setDescription(`||${message.content}||`).setFooter({
        text: `⚠️ ${t('phone.link', {
          lng: otherLng
        })}`
      });
    }

    // Check for profanity using an external API
    // const res = await fetch('https://vector.profanity.dev', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message: message.content })
    // }).catch((err) => logger.debug({ err }, 'Could not fetch profanity API'));

    // if (res) {
    //   const response: { isProfanity: boolean; score: number } = await res.json();
    //   // Replace message content if it contains profanity
    //   if (response.isProfanity) {
    //     embed.setDescription(`||${message.content.slice(0, 1990)}||`).setFooter({
    //       text: `⚠️ ${t('phone.profanity', {
    //         lng
    //       })}`
    //     });

    //     otherEmbed.setDescription(`||${message.content.slice(0, 1990)}||`).setFooter({
    //       text: `⚠️ ${t('phone.profanity', {
    //         lng: otherLng
    //       })}`
    //     });
    //   }
    // }

    // Determine the connected channel ID
    const connectedChannelId = existingConnection.channelIdOne === message.channel.id ? existingConnection.channelIdTwo : existingConnection.channelIdOne;

    // Fetch the target channel
    const targetChannel = await client.channels
      .fetch(connectedChannelId)
      .catch((err) => logger.debug({ err, channelId: connectedChannelId }, 'Could not fetch channel'));
    // Ensure the target channel is a text channel
    if (!targetChannel?.isSendable()) return;

    // If the message is a reply, show what the user is replying to
    const replyMessage = await message.fetchReference().catch(() => null);

    let replyEmbed: EmbedBuilder | null = null;
    let otherReplyEmbed: EmbedBuilder | null = null;

    if (replyMessage && replyMessage.author) {
      if (replyMessage.content) {
        replyEmbed = new EmbedBuilder()
          .setColor(client.colors.phone)
          .setAuthor({
            name: `${t('phone.reply', { lng })} ${replyMessage.author.globalName ? `${replyMessage.author.globalName} (@${replyMessage.author.username})` : `${replyMessage.author.username}`}`,
            iconURL: replyMessage.author.displayAvatarURL({ extension: 'webp', size: 256 })
          })
          .setDescription(replyMessage.content)
          .setTimestamp(replyMessage.createdAt);
        otherReplyEmbed = new EmbedBuilder()
          .setColor(client.colors.phone)
          .setAuthor({
            name: `${t('phone.reply', { lng: otherLng })} ${replyMessage.author.globalName ? `${replyMessage.author.globalName} (@${replyMessage.author.username})` : `${replyMessage.author.username}`}`,
            iconURL: replyMessage.author.displayAvatarURL({ extension: 'webp', size: 256 })
          })
          .setDescription(replyMessage.content)
          .setTimestamp(replyMessage.createdAt);
      } else if (replyMessage.embeds.length) {
        replyEmbed = new EmbedBuilder(replyMessage.embeds[0].data).setColor(client.colors.phone).setAuthor({
          name: t('phone.reply', { lng }) + ` ${replyMessage.embeds[0].data.author?.name}`,
          iconURL: replyMessage.embeds[0].data.author?.icon_url
        });
        otherReplyEmbed = new EmbedBuilder(replyMessage.embeds[0].data).setColor(client.colors.phone).setAuthor({
          name: t('phone.reply', { lng: otherLng }) + ` ${replyMessage.embeds[0].data.author?.name}`,
          iconURL: replyMessage.embeds[0].data.author?.icon_url
        });
      }
    }

    // Send the embed to current channel if message can be deleted or else react to it
    if (message.deletable)
      await message
        .delete()
        .catch((err) => logger.debug({ err, messageId: message.id }, 'Could not delete message'))
        .then(async () => {
          await channel
            .send({
              embeds: replyEmbed ? [embed, replyEmbed] : [embed]
            })
            .catch((err) => logger.debug({ err, channelId: channel.id }, 'Could not send message'));
        });
    else message.react('✅').catch((err) => logger.debug({ err, messageId: message.id }, 'Could not react'));

    // Send the embed to the target channel
    await targetChannel
      .send({
        embeds: otherReplyEmbed ? [otherEmbed, otherReplyEmbed] : [otherEmbed]
      })
      .catch((err) => logger.debug({ err, channelId: targetChannel.id }, 'Could not send message'));

    await updateLastMessageAt(existingConnection._id);

    // Delete connection if it has been inactive
    const TIMEOUT = 1_000 * 60 * 4; // = 4 minutes
    setTimeout(async () => handlePhoneMessageTimeout({ channel, existingConnection, lng, otherLng, targetChannel, timeout: TIMEOUT }), TIMEOUT);
  }
});

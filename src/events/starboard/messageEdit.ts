import { EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

import { getStarboard } from 'db/starboard';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageUpdate,
  async execute(_client, _oldMessage, newMessage) {
    if (newMessage.partial) {
      await newMessage.fetch().catch((err) => logger.debug({ err }, 'Could not fetch message'));
    }

    if (!newMessage.inGuild() || !newMessage.author || newMessage.author.bot) {
      return;
    }

    const starboard = await getStarboard(newMessage.guild.id);

    if (!starboard?.enabled || !starboard.channelId || !starboard.minimumStars) {
      return;
    }

    const knownMessage = starboard.messages.find((msg) => msg.messageId === newMessage.id);

    if (!knownMessage || !knownMessage.starboardMessageId) {
      return;
    }

    const channel = newMessage.guild.channels.cache.get(starboard.channelId);

    if (!channel || channel.type !== newMessage.channel.type) {
      return;
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: newMessage.author.displayName,
        iconURL: newMessage.author.displayAvatarURL(),
        url: newMessage.url
      })
      .setTimestamp(newMessage.createdAt);

    const attachment = newMessage.attachments.first();

    if (attachment && attachment.contentType && (attachment.contentType.startsWith('image/') || attachment.contentType.startsWith('video/'))) {
      embed.setImage(attachment.url);
    }

    if (newMessage.content?.length) {
      embed.setDescription(newMessage.content);
    }

    await channel.messages.edit(knownMessage.starboardMessageId, { embeds: [embed] }).catch((err) => logger.debug({ err }, 'Could not edit starboard message'));
  }
});

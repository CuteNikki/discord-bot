import { EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageUpdate,
  async execute(client, _oldMessage, newMessage) {
    if (newMessage.partial) await newMessage.fetch().catch((error) => logger.debug(error, 'Could not fetch message'));
    if (!newMessage.inGuild() || !newMessage.author || newMessage.author.bot) return;

    const config = await client.getGuildSettings(newMessage.guild.id);
    if (!config.starboard.enabled || !config.starboard.channelId || !config.starboard.minimumStars) return;

    const knownMessage = config.starboard.messages.find((msg) => msg.messageId === newMessage.id);
    if (!knownMessage || !knownMessage.starboardMessageId) return;

    const channel = newMessage.guild.channels.cache.get(config.starboard.channelId);
    if (!channel || channel.type !== newMessage.channel.type) return;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: newMessage.author.displayName,
        iconURL: newMessage.author.displayAvatarURL(),
        url: newMessage.url,
      })
      .setTimestamp(newMessage.createdAt);
    const attachment = newMessage.attachments.first();
    if (attachment && attachment.contentType && (attachment.contentType.startsWith('image/') || attachment.contentType.startsWith('video/')))
      embed.setImage(attachment.url);
    if (newMessage.content?.length) embed.setDescription(newMessage.content);

    await channel.messages.edit(knownMessage.starboardMessageId, { embeds: [embed] }).catch((error) => logger.debug(error, 'Could not edit starboard message'));
  },
});

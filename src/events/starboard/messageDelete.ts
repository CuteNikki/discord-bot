import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { getStarboard, removeStarboardMessage } from 'db/starboard';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageDelete,
  async execute(_client, message) {
    if (!message.inGuild() || !message.author || message.author.bot) {
      return;
    }

    const starboard = await getStarboard(message.guild.id);

    if (!starboard || !starboard.enabled || !starboard.channelId || !starboard.minimumStars) {
      return;
    }

    const knownMessage = starboard.messages.find((msg) => msg.messageId === message.id);

    if (!knownMessage || !knownMessage.starboardMessageId) {
      return;
    }

    await removeStarboardMessage(message.guild.id, knownMessage.messageId);

    const channel = message.guild.channels.cache.get(starboard.channelId);

    if (!channel || channel.type !== message.channel.type) {
      return;
    }

    await channel.messages.delete(knownMessage.starboardMessageId).catch((err) => logger.debug({ err }, 'Could not delete starboard message'));
  }
});

import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { getGuildSettings, updateGuildSettings } from 'db/guild';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageDelete,
  async execute(client, message) {
    if (!message.inGuild() || !message.author || message.author.bot) return;

    const config = await getGuildSettings(message.guild.id);
    if (!config.starboard.enabled || !config.starboard.channelId || !config.starboard.minimumStars) return;

    const knownMessage = config.starboard.messages.find((msg) => msg.messageId === message.id);
    if (!knownMessage || !knownMessage.starboardMessageId) return;

    await updateGuildSettings(message.guild.id, {
      $pull: {
        ['starboard.messages']: knownMessage,
      },
    });

    const channel = message.guild.channels.cache.get(config.starboard.channelId);
    if (!channel || channel.type !== message.channel.type) return;

    await channel.messages.delete(knownMessage.starboardMessageId).catch((err) => logger.debug({ err }, 'Could not delete starboard message'));
  },
});

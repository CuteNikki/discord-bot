import { Events, PermissionsBitField } from 'discord.js';

import { Event } from 'classes/event';

import { getGuildSettings, updateGuildSettings } from 'db/guild';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageReactionRemove,
  async execute(client, reaction, user) {
    if (reaction.emoji.name !== '⭐' || user.bot) return;

    const guild = reaction.message.guild;
    if (!guild || !guild.members.me) return;

    const config = await getGuildSettings(guild.id);
    if (!config.starboard.enabled || !config.starboard.channelId || !config.starboard.minimumStars) return;

    if (reaction.message.partial) await reaction.message.fetch().catch((err) => logger.debug({ err }, 'Could not fetch message'));

    const channel = guild.channels.cache.get(config.starboard.channelId);
    if (!channel?.isSendable() || !channel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)) return;

    const knownMessage = config.starboard.messages.find((message) => message.messageId === reaction.message.id);
    const knownStarboardMessage = config.starboard.messages.find((message) => message.starboardMessageId === reaction.message.id);

    if (knownMessage) {
      let stars = knownMessage.reactedUsers.length;
      if (knownMessage.reactedUsers.includes(user.id)) {
        stars -= 1;
        await updateGuildSettings(guild.id, {
          $set: {
            ['starboard.messages']: [
              ...config.starboard.messages.filter((msg) => msg.messageId !== knownMessage.messageId),
              { ...knownMessage, reactedUsers: knownMessage.reactedUsers.filter((reactedUser) => reactedUser !== user.id) },
            ],
          },
        });
      }

      if (knownMessage.starboardMessageId) {
        if (stars < config.starboard.minimumStars)
          return await channel.messages.delete(knownMessage.starboardMessageId).catch((err) => logger.debug({ err }, 'Could not delete starboard message'));
        return await channel.messages
          .edit(knownMessage.starboardMessageId, { content: `${stars} ⭐` })
          .catch((err) => logger.debug({ err }, 'Could not edit starboard message'));
      }
    }
    if (knownStarboardMessage) {
      let stars = knownStarboardMessage.reactedUsers.length;
      if (knownStarboardMessage.reactedUsers.includes(user.id)) {
        stars -= 1;
        await updateGuildSettings(guild.id, {
          $set: {
            ['starboard.messages']: [
              ...config.starboard.messages.filter((msg) => msg.messageId !== knownStarboardMessage.messageId),
              { ...knownStarboardMessage, reactedUsers: knownStarboardMessage.reactedUsers.filter((reactedUser) => reactedUser !== user.id) },
            ],
          },
        });
      }
      if (stars < config.starboard.minimumStars)
        return await reaction.message.delete().catch((err) => logger.debug({ err }, 'Could not delete starboard message'));
      if (reaction.message.editable)
        return await reaction.message.edit({ content: `${stars} ⭐` }).catch((err) => logger.debug({ err }, 'Could not edit starboard message'));
    }
  },
});

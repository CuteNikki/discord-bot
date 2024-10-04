import { Events, PermissionsBitField } from 'discord.js';

import { Event } from 'classes/event';

import { updateGuildSettings } from 'db/guild';

import { getStarboard } from 'db/starboard';
import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageReactionRemove,
  async execute(_client, reaction, user) {
    if (reaction.emoji.name !== '⭐' || user.bot) {
      return;
    }

    const guild = reaction.message.guild;

    if (!guild?.members?.me) {
      return;
    }

    const starboard = await getStarboard(guild.id);

    if (!starboard.enabled || !starboard.channelId || !starboard.minimumStars) {
      return;
    }

    if (reaction.message.partial) {
      await reaction.message.fetch().catch((err) => logger.debug({ err }, 'Could not fetch message'));
    }

    const channel = guild.channels.cache.get(starboard.channelId);

    if (!channel?.isSendable() || !channel.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
      return;
    }

    const knownMessage = starboard.messages.find((message) => message.messageId === reaction.message.id);
    const knownStarboardMessage = starboard.messages.find((message) => message.starboardMessageId === reaction.message.id);

    if (knownMessage) {
      let stars = knownMessage.reactedUsers.length;

      if (knownMessage.reactedUsers.includes(user.id)) {
        stars -= 1;
        await updateGuildSettings(guild.id, {
          $set: {
            ['starboard.messages']: [
              ...starboard.messages.filter((msg) => msg.messageId !== knownMessage.messageId),
              { ...knownMessage, reactedUsers: knownMessage.reactedUsers.filter((reactedUser) => reactedUser !== user.id) }
            ]
          }
        });
      }

      if (knownMessage.starboardMessageId) {
        if (stars < starboard.minimumStars) {
          await channel.messages.delete(knownMessage.starboardMessageId).catch((err) => logger.debug({ err }, 'Could not delete starboard message'));
          return;
        }

        await channel.messages
          .edit(knownMessage.starboardMessageId, { content: `${stars} ⭐` })
          .catch((err) => logger.debug({ err }, 'Could not edit starboard message'));
        return;
      }
    }

    if (knownStarboardMessage) {
      let stars = knownStarboardMessage.reactedUsers.length;

      if (knownStarboardMessage.reactedUsers.includes(user.id)) {
        stars -= 1;

        await updateGuildSettings(guild.id, {
          $set: {
            ['starboard.messages']: [
              ...starboard.messages.filter((msg) => msg.messageId !== knownStarboardMessage.messageId),
              { ...knownStarboardMessage, reactedUsers: knownStarboardMessage.reactedUsers.filter((reactedUser) => reactedUser !== user.id) }
            ]
          }
        });
      }

      if (stars < starboard.minimumStars) {
        await reaction.message.delete().catch((err) => logger.debug({ err }, 'Could not delete starboard message'));
        return;
      }

      if (reaction.message.editable) {
        await reaction.message.edit({ content: `${stars} ⭐` }).catch((err) => logger.debug({ err }, 'Could not edit starboard message'));
      }
    }
  }
});

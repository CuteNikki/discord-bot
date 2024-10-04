import { EmbedBuilder, Events, PermissionsBitField } from 'discord.js';

import { Event } from 'classes/event';

import { updateGuildSettings } from 'db/guild';
import { addStarboardMessage, getStarboard } from 'db/starboard';

import { keys } from 'constants/keys';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageReactionAdd,
  async execute(_client, reaction, user) {
    if (reaction.partial) {
      await reaction.fetch().catch((err) => logger.debug({ err }, 'Could not fetch reaction'));
    }

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

    let knownMessage = starboard.messages.find((message) => message.messageId === reaction.message.id);
    const knownStarboardMessage = starboard.messages.find((message) => message.starboardMessageId === reaction.message.id);

    if (!knownMessage && !knownStarboardMessage) {
      if (reaction.message.author?.id === keys.DISCORD_BOT_ID) {
        return;
      }

      const reactedUsers = reaction.message.reactions.cache.get('⭐')?.users.cache.map((user) => user.id) ?? [];
      await addStarboardMessage(guild.id, reaction.message.id, reactedUsers);

      knownMessage = { messageId: reaction.message.id, reactedUsers };
    }

    if (knownMessage) {
      let stars = knownMessage.reactedUsers.length;
      if (!knownMessage.reactedUsers.includes(user.id)) {
        stars += 1;

        await updateGuildSettings(guild.id, {
          $set: {
            ['starboard.messages']: [
              ...starboard.messages.filter((msg) => msg.messageId !== knownMessage?.messageId),
              {
                ...knownMessage,
                reactedUsers: [...knownMessage.reactedUsers, user.id]
              }
            ]
          }
        });
        knownMessage = { ...knownMessage, reactedUsers: [...knownMessage.reactedUsers, user.id] };
      }

      if (knownMessage.starboardMessageId) {
        const msg = await channel.messages
          .edit(knownMessage.starboardMessageId, { content: `${stars} ⭐` })
          .catch((err) => logger.debug({ err }, 'Could not edit starboard message'));

        if (!msg) {
          const embed = new EmbedBuilder()
            .setAuthor({
              name: reaction.message.author?.displayName || 'Unknown User',
              iconURL: reaction.message.author?.displayAvatarURL(),
              url: reaction.message.url
            })
            .setTimestamp(reaction.message.createdAt);

          const attachment = reaction.message.attachments.first();

          if (attachment && attachment.contentType && (attachment.contentType.startsWith('image/') || attachment.contentType.startsWith('video/'))) {
            embed.setImage(attachment.url);
          }

          if (reaction.message.content?.length) {
            embed.setDescription(reaction.message.content);
          }

          const msg = await channel.send({
            content: `${stars} ⭐`,
            embeds: [embed]
          });

          if (msg) {
            await msg.react('⭐').catch((err) => logger.debug({ err }, 'Could not react to starboard message'));
          }

          await updateGuildSettings(guild.id, {
            $set: {
              ['starboard.messages']: [
                ...starboard.messages.filter((msg) => msg.messageId !== reaction.message.id),
                {
                  ...knownMessage,
                  starboardMessageId: msg?.id
                }
              ]
            }
          });
        }
      } else {
        const embed = new EmbedBuilder()
          .setAuthor({
            name: reaction.message.author?.displayName || 'Unknown User',
            iconURL: reaction.message.author?.displayAvatarURL(),
            url: reaction.message.url
          })
          .setTimestamp(reaction.message.createdAt);

        const attachment = reaction.message.attachments.first();

        if (attachment && attachment.contentType && (attachment.contentType.startsWith('image/') || attachment.contentType.startsWith('video/'))) {
          embed.setImage(attachment.url);
        }

        if (reaction.message.content?.length) {
          embed.setDescription(reaction.message.content);
        }

        const msg = await channel
          .send({
            content: `${stars} ⭐`,
            embeds: [embed]
          })
          .catch((err) => logger.debug({ err }, 'Could not send starboard message'));

        if (msg) {
          await msg.react('⭐').catch((err) => logger.debug({ err }, 'Could not react to starboard message'));
        }

        await updateGuildSettings(guild.id, {
          $set: {
            ['starboard.messages']: [
              ...starboard.messages.filter((msg) => msg.messageId !== reaction.message.id),
              {
                ...knownMessage,
                starboardMessageId: msg?.id
              }
            ]
          }
        });
      }
    }
    if (knownStarboardMessage && knownStarboardMessage.starboardMessageId) {
      let stars = knownStarboardMessage.reactedUsers.length;

      if (!knownStarboardMessage.reactedUsers.includes(user.id)) {
        stars += 1;

        await updateGuildSettings(guild.id, {
          $set: {
            ['starboard.messages']: [
              ...starboard.messages.filter((msg) => msg.messageId !== knownStarboardMessage.messageId),
              {
                ...knownStarboardMessage,
                reactedUsers: [...knownStarboardMessage.reactedUsers, user.id]
              }
            ]
          }
        });
      }

      await channel.messages
        .edit(knownStarboardMessage.starboardMessageId, { content: `${stars} ⭐` })
        .catch((err) => logger.debug({ err }, 'Could not edit starboard message'));
    }
  }
});

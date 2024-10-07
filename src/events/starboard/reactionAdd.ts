import { EmbedBuilder, Events, PermissionsBitField } from 'discord.js';

import { Event } from 'classes/event';

import { addReactedUser, addStarboardMessage, getStarboard, updateStarboardMessage } from 'db/starboard';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageReactionAdd,
  async execute(client, reaction, user) {
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

    let knownMessage = starboard.messages.find((msg) => msg.messageId === reaction.message.id);
    const knownStarboardMessage = starboard.messages.find((msg) => msg.starboardMessageId === reaction.message.id);

    if (!knownMessage && !knownStarboardMessage) {
      knownMessage = await addStarboardMessage(
        guild.id,
        reaction.message.id,
        reaction.message.reactions.cache.get('⭐')?.users.cache.map((user) => user.id) ?? [user.id]
      );
    }

    if (knownMessage) {
      let stars = knownMessage.reactedUsers.length;

      if (!knownMessage.reactedUsers.includes(user.id)) {
        knownMessage = (await addReactedUser(knownMessage._id, user.id)) ?? undefined;
        stars++;
      }

      if (knownMessage?.starboardMessageId) {
        await channel.messages
          .edit(knownMessage.starboardMessageId, { content: `${stars} ⭐` })
          .catch((err) => logger.debug({ err }, 'Could not edit starboard message'));
        return;
      }

      if (knownMessage && !knownMessage.starboardMessageId && stars >= starboard.minimumStars) {
        const embed = new EmbedBuilder()
          .setColor(client.colors.starboard)
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
        if (!msg) return;

        await msg.react('⭐').catch((err) => logger.debug({ err }, 'Could not react to starboard message'));

        await updateStarboardMessage(knownMessage._id, { starboardMessageId: msg.id });
        return;
      }
    }

    if (knownStarboardMessage) {
      let stars = knownStarboardMessage.reactedUsers.length;

      if (!knownStarboardMessage.reactedUsers.includes(user.id)) {
        await addReactedUser(knownStarboardMessage._id, user.id);
        stars++;
      }

      if (reaction.message.editable) {
        await reaction.message.edit({ content: `${stars} ⭐` }).catch((err) => logger.debug({ err }, 'Could not edit starboard message'));
      }
    }
  }
});

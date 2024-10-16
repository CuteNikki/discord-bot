import { Events, PermissionFlagsBits } from 'discord.js';

import { Event } from 'classes/event';

import { getReactionRoles } from 'db/reaction-roles';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageReactionRemove,
  once: false,
  async execute(_client, reaction, user) {
    if (!reaction.message.inGuild()) {
      return;
    }

    const reactionRoles = await getReactionRoles(reaction.message.guildId);

    if (!reactionRoles?.enabled) {
      return;
    }

    const group = reactionRoles.groups.find((g) => g.messageId === reaction.message.id);

    if (!group) {
      return;
    }

    const reactionIndex = group.reactions.findIndex((r) => r.emoji === reaction.emoji.toString());

    if (reactionIndex === -1) {
      return;
    }

    const role = reaction.message.guild.roles.cache.get(group.reactions[reactionIndex].roleId);

    if (!role) {
      return;
    }

    const member = reaction.message.guild.members.cache.get(user.id);

    if (!member) {
      return;
    }

    if (group.requiredRoles?.length && !member.roles.cache.hasAll(...group.requiredRoles) && !member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return;
    }

    if (!member.roles.cache.has(role.id)) {
      return;
    }

    await member.roles.remove(role).catch((err) => logger.debug({ err }, 'ReactionRoles | ReactionRemove: Could not remove role'));
  }
});

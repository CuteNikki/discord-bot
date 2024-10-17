import { Events, PermissionFlagsBits } from 'discord.js';

import { Event } from 'classes/event';

import { getReactionRoles } from 'db/reaction-roles';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageReactionAdd,
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

    if (group.requiredRoles?.length && !member.roles.cache.hasAny(...group.requiredRoles) && !member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return;
    }

    if (group.singleMode && member.roles.cache.hasAny(...group.reactions.map((r) => r.roleId))) {
      const removed = await member.roles
        .remove(member.roles.cache.filter((r) => group.reactions.map((rea) => rea.roleId).includes(r.id))!)
        .catch((err) => logger.debug({ err }, 'ReactionRoles | Select: Could not remove role'));

      if (!removed) {
        return;
      }
    }

    if (member.roles.cache.has(role.id)) {
      return;
    }

    await member.roles.add(role).catch((err) => logger.debug({ err }, 'ReactionRoles | ReactionAdd: Could not add role'));
  }
});

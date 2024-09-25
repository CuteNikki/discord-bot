import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { getGuildSettings } from 'db/guild';

export default new Event({
  name: Events.MessageReactionAdd,
  once: false,
  async execute(_client, reaction, user, _details) {
    if (!reaction.message.inGuild()) return;

    const config = await getGuildSettings(reaction.message.guildId);
    if (!config.reactionRoles.enabled) return;

    const group = config.reactionRoles.groups.find((g) => g.messageId === reaction.message.id);
    if (!group) return;

    const reactionIndex = group.reactions.findIndex((r) => r.emoji === reaction.emoji.toString());
    if (reactionIndex === -1) return;

    const role = reaction.message.guild.roles.cache.get(group.reactions[reactionIndex].roleId);
    if (!role) return;

    const member = reaction.message.guild.members.cache.get(user.id);
    if (!member) return;

    if (member.roles.cache.has(role.id)) return;

    await member.roles.add(role).catch((err) => console.error(err));
  },
});

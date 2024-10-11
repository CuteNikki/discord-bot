import { Events } from 'discord.js';

import { getEmbed, replacePlaceholders } from 'classes/custom-embed';
import { Event } from 'classes/event';

import { getWelcome } from 'db/welcome';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildMemberAdd,
  once: false,
  async execute(client, member) {
    if (member.user.bot || member.pending) return;

    if (member.partial) await member.fetch().catch((err) => logger.debug({ err, member: member.id }, 'Could not fetch member'));

    const welcome = (await getWelcome(member.guild.id)) ?? { enabled: false, roles: [], message: { content: null, embed: {} }, channelId: undefined };

    if (!welcome.enabled) return;
    await member.roles.add(welcome.roles).catch((err) => logger.debug({ err }, 'Could not add role(s)'));

    if (!welcome.channelId) return;
    const welcomeChannel = await member.guild.channels.fetch(welcome.channelId);
    if (!welcomeChannel?.isSendable()) return;

    await welcomeChannel
      .send({
        content: replacePlaceholders(welcome.message.content ?? '', member.user, member.guild),
        embeds: [getEmbed(member.user, member.guild, welcome.message.embed)]
      })
      .catch((err) => logger.debug({ err }, 'Could not send welcome message'));
  }
});

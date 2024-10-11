import { Events } from 'discord.js';

import { getEmbed, replacePlaceholders } from 'classes/custom-embed';
import { Event } from 'classes/event';

import { getWelcome } from 'db/welcome';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(_client, oldMember, newMember) {
    if (newMember.user.bot || !oldMember.pending || newMember.pending) return;

    const welcome = (await getWelcome(newMember.guild.id)) ?? { enabled: false, roles: [], message: { content: null, embed: {} }, channelId: undefined };

    if (!welcome.enabled) return;
    await newMember.roles.add(welcome.roles).catch((err) => logger.debug({ err }, 'Could not add role(s)'));

    if (!welcome.channelId) return;
    const welcomeChannel = await newMember.guild.channels.fetch(welcome.channelId);
    if (!welcomeChannel?.isSendable()) return;

    await welcomeChannel
      .send({
        content: replacePlaceholders(welcome.message.content ?? '', newMember.user, newMember.guild),
        embeds: [getEmbed(newMember.user, newMember.guild, welcome.message.embed)]
      })
      .catch((err) => logger.debug({ err }, 'Could not send welcome message'));
  }
});

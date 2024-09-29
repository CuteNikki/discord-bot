import { Events } from 'discord.js';

import { getEmbed, replacePlaceholders } from 'classes/custom-embed';
import { Event } from 'classes/event';

import { getGuildSettings } from 'db/guild';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildMemberAdd,
  once: false,
  async execute(client, member) {
    if (member.user.bot || member.pending) return;

    if (member.partial) await member.fetch().catch((err) => logger.debug({ err, member: member.id }, 'Could not fetch member'));

    const config = await getGuildSettings(member.guild.id);

    if (!config.welcome.enabled) return;
    await member.roles.add(config.welcome.roles).catch((err) => logger.debug({ err }, 'Could not add role(s)'));

    if (!config.welcome.channelId) return;
    const welcomeChannel = await member.guild.channels.fetch(config.welcome.channelId);
    if (!welcomeChannel?.isSendable()) return;

    await welcomeChannel
      .send({
        content: replacePlaceholders(config.welcome.message.content ?? '', member.user, member.guild),
        embeds: [getEmbed(member.user, member.guild, config.welcome.message.embed)]
      })
      .catch((err) => logger.debug({ err }, 'Could not send welcome message'));
  }
});

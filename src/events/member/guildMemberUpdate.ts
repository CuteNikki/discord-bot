import { Events } from 'discord.js';

import { getEmbed, replacePlaceholders } from 'classes/custom-embed';
import { Event } from 'classes/event';

import { getGuild } from 'db/guild';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(_client, oldMember, newMember) {
    if (newMember.user.bot || !oldMember.pending || newMember.pending) return;

    const config = await getGuild(newMember.guild.id);

    if (!config.welcome.enabled) return;
    await newMember.roles.add(config.welcome.roles).catch((err) => logger.debug({ err }, 'Could not add role(s)'));

    if (!config.welcome.channelId) return;
    const welcomeChannel = await newMember.guild.channels.fetch(config.welcome.channelId);
    if (!welcomeChannel?.isSendable()) return;

    await welcomeChannel
      .send({
        content: replacePlaceholders(config.welcome.message.content ?? '', newMember.user, newMember.guild),
        embeds: [getEmbed(newMember.user, newMember.guild, config.welcome.message.embed)]
      })
      .catch((err) => logger.debug({ err }, 'Could not send welcome message'));
  }
});

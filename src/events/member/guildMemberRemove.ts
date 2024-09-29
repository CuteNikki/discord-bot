import { Events } from 'discord.js';

import { getEmbed, replacePlaceholders } from 'classes/custom-embed';
import { Event } from 'classes/event';

import { getGuildSettings } from 'db/guild';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildMemberRemove,
  once: false,
  async execute(_client, member) {
    if (member.user.bot) return;

    const config = await getGuildSettings(member.guild.id);

    if (!config.farewell.enabled || !config.farewell.channelId) return;
    const farewellChannel = await member.guild.channels.fetch(config.farewell.channelId);
    if (!farewellChannel?.isSendable()) return;

    await farewellChannel
      .send({
        content: replacePlaceholders(config.farewell.message.content ?? '', member.user, member.guild),
        embeds: [getEmbed(member.user, member.guild, config.farewell.message.embed)]
      })
      .catch((err) => logger.debug({ err }, 'Could not send farewell message'));
  }
});

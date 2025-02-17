import { Events } from 'discord.js';

import { getEmbed, replacePlaceholders } from 'classes/custom-embed';
import { Event } from 'classes/event';

import { getFarewell } from 'db/farewell';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildMemberRemove,
  once: false,
  async execute(_client, member) {
    if (member.user.bot || member.pending) return;

    const farewell = (await getFarewell(member.guild.id)) ?? { enabled: false, message: { content: null, embed: {} }, channelId: undefined };

    if (!farewell.enabled || !farewell.channelId) return;
    const farewellChannel = await member.guild.channels.fetch(farewell.channelId);
    if (!farewellChannel?.isSendable()) return;

    await farewellChannel
      .send({
        content: replacePlaceholders(farewell.message.content ?? '', member.user, member.guild),
        embeds: [getEmbed(member.user, member.guild, farewell.message.embed)]
      })
      .catch((err) => logger.debug({ err }, 'Could not send farewell message'));
  }
});

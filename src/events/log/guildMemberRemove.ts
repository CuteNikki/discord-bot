import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { LoggedEvent } from 'types/guild-log';

export default new Event({
  name: Events.GuildMemberRemove,
  once: false,
  async execute(_client, member) {
    const { guild, user, partial, joinedTimestamp } = member;

    if (partial) {
      await member.fetch().catch((err) => logger.debug({ err }, 'GuildLog | GuildMemberRemove: Could not fetch member'));
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as LoggedEvent[] };

    const event = log.events.find((e) => e.name === Events.GuildMemberRemove) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels
      .fetch(event.channelId)
      .catch((err) => logger.debug({ err }, 'GuildLog | GuildMemberRemove: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle(t('log.guildMemberRemove.title', { lng }))
            .addFields(
              {
                name: t('log.guildMemberRemove.member', { lng }),
                value: `${user.toString()} (\`${user.username}\` | ${user.id})`
              },
              {
                name: t('log.guildMemberRemove.created-at', { lng }),
                value: `<t:${Math.floor(user.createdTimestamp / 1000)}:f> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`
              },
              {
                name: t('log.guildMemberRemove.joined-at', { lng }),
                value: `<t:${Math.floor((joinedTimestamp || 0) / 1000)}:f> (<t:${Math.floor((joinedTimestamp || 0) / 1000)}:R>)`
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | GuildMemberRemove: Could not send message'));
  }
});

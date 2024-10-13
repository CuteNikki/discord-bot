import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { GuildLogEvent } from 'types/guild-log';

export default new Event({
  name: Events.ThreadCreate,
  once: false,
  async execute(_client, thread) {
    const { guild, name, id, appliedTags, ownerId } = thread;

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as GuildLogEvent[] };

    const event = log.events.find((e) => e.name === Events.ThreadCreate) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | ThreadCreate: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const owner = await thread.fetchOwner().catch((err) => logger.debug({ err }, 'GuildLog | ThreadCreate: Could not fetch thread owner'));

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle(t('log.threadCreate.title', { lng }))
            .addFields(
              {
                name: t('log.threadCreate.thread', { lng }),
                value: `${thread.toString()} (\`${name}\` | ${id})`
              },
              {
                name: t('log.threadCreate.owner', { lng }),
                value: owner ? `<@${owner.id}> (\`${owner.user?.username}\` | ${ownerId})` : '/'
              },
              {
                name: t('log.threadCreate.applied-tags', { lng }),
                value: appliedTags.join('\n').slice(0, 1000) || '/'
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | ThreadCreate: Could not send message'));
  }
});

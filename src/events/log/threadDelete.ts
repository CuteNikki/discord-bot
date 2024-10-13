import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { GuildLogEvent } from 'types/guild-log';

export default new Event({
  name: Events.ThreadDelete,
  once: false,
  async execute(_client, thread) {
    const { guild, name, id, appliedTags, createdTimestamp, archiveTimestamp, locked, ownerId } = thread;

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as GuildLogEvent[] };

    const event = log.events.find((e) => e.name === Events.ThreadDelete) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | ThreadDelete: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const owner = await thread.fetchOwner().catch((err) => logger.debug({ err }, 'GuildLog | ThreadDelete: Could not fetch thread owner'));

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle(t('log.threadDelete.title', { lng }))
            .addFields(
              {
                name: t('log.threadDelete.thread', { lng }),
                value: `\`${name}\` (${id})`
              },
              {
                name: t('log.threadDelete.owner', { lng }),
                value: owner ? `<@${ownerId}> (\`${owner.user?.username}\` | ${ownerId})` : '/'
              },
              { name: t('log.threadDelete.locked', { lng }), value: `${locked}` },
              {
                name: t('log.threadDelete.applied-tags', { lng }),
                value: appliedTags.join('\n').slice(0, 1000) || '/'
              },
              {
                name: t('log.threadDelete.archived-at', { lng }),
                value: archiveTimestamp ? `<t:${Math.floor(archiveTimestamp / 1000)}:f>` : '/'
              },
              {
                name: t('log.threadDelete.created-at', { lng }),
                value: createdTimestamp ? `<t:${Math.floor(createdTimestamp / 1000)}:f>` : '/'
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | ThreadDelete: Could not send message'));
  }
});

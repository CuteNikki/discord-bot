import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { GuildLogEvent } from 'types/guild-log';

export default new Event({
  name: Events.GuildScheduledEventUserRemove,
  once: false,
  async execute(_client, scheduledEvent, user) {
    const guild = scheduledEvent.guild;

    if (!guild) {
      return;
    }

    if (scheduledEvent.partial) {
      await scheduledEvent.fetch().catch((err) => logger.debug({ err }, 'Could not fetch guild scheduled event'));
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as GuildLogEvent[] };

    const event = log.events.find((e) => e.name === Events.GuildScheduledEventUserRemove) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels
      .fetch(event.channelId)
      .catch((err) => logger.debug({ err }, 'GuildLog | GuildScheduledEventUserRemove: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle(t('log.guildScheduledEventUserRemove.title', { lng }))
            .setImage(scheduledEvent.coverImageURL({ size: 1024 }))
            .addFields(
              {
                name: t('log.guildScheduledEventUserRemove.event', { lng }),
                value: `[${scheduledEvent.name}](${scheduledEvent.url})`
              },
              {
                name: t('log.guildScheduledEventUserRemove.user', { lng }),
                value: `${user.toString()} (\`${user.username}\` | ${user.id})`
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | GuildScheduledEventUserRemove: Could not send message'));
  }
});

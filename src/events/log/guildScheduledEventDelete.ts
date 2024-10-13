import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { GuildLogEvent } from 'types/guild-log';

export default new Event({
  name: Events.GuildScheduledEventDelete,
  once: false,
  async execute(_client, scheduledEvent) {
    const { guild, name, creator, description, scheduledStartTimestamp, scheduledEndTimestamp, url, createdTimestamp, channel, entityMetadata } =
      scheduledEvent;

    if (!guild) {
      return;
    }

    if (scheduledEvent.partial) {
      await scheduledEvent.fetch().catch((err) => logger.debug({ err }, 'Could not fetch guild scheduled event'));
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as GuildLogEvent[] };

    const event = log.events.find((e) => e.name === Events.GuildScheduledEventDelete) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId);

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle(t('log.guildScheduledEventDelete.title', { lng }))
            .setImage(scheduledEvent.coverImageURL({ size: 1024 }))
            .addFields(
              {
                name: t('log.guildScheduledEventDelete.name', { lng }),
                value: name || '/'
              },
              {
                name: t('log.guildScheduledEventDelete.description', { lng }),
                value: description || '/'
              },
              {
                name: t('log.guildScheduledEventDelete.url', { lng }),
                value: url
              },
              {
                name: t('log.guildScheduledEventDelete.location', { lng }),
                value: channel ? `${channel.toString()} (\`${channel.name}\` | ${channel.id})` : entityMetadata?.location ? `${entityMetadata?.location}` : '/'
              },
              {
                name: t('log.guildScheduledEventDelete.creator', { lng }),
                value: creator ? `${creator.toString()} (\`${creator.username}\` | ${creator.id})` : '/'
              },
              {
                name: t('log.guildScheduledEventDelete.created-at', { lng }),
                value: `<t:${Math.floor(createdTimestamp / 1000)}:f>`
              },
              {
                name: t('log.guildScheduledEventDelete.start', { lng }),
                value: scheduledStartTimestamp
                  ? `<t:${Math.floor(scheduledStartTimestamp / 1000)}:f> (<t:${Math.floor(scheduledStartTimestamp / 1000)}:R>)`
                  : '/'
              },
              {
                name: t('log.guildScheduledEventDelete.end', { lng }),
                value: scheduledEndTimestamp ? `<t:${Math.floor(scheduledEndTimestamp / 1000)}:f> (<t:${Math.floor(scheduledEndTimestamp / 1000)}:R>)` : '/'
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | GuildScheduledEventDelete: Could not send message'));
  }
});

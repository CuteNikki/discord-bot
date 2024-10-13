import { Colors, EmbedBuilder, Events, GuildScheduledEventPrivacyLevel, GuildScheduledEventStatus } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { GuildLogEvent } from 'types/guild-log';

export default new Event({
  name: Events.GuildScheduledEventCreate,
  once: false,
  async execute(_client, scheduledEvent) {
    const { guild, name, status, creator, description, scheduledStartTimestamp, scheduledEndTimestamp, url, privacyLevel, channel, entityMetadata } =
      scheduledEvent;

    if (!guild) {
      return;
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as GuildLogEvent[] };

    const event = log.events.find((e) => e.name === Events.GuildScheduledEventCreate) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels
      .fetch(event.channelId)
      .catch((err) => logger.debug({ err }, 'GuildLog | GuildScheduledEventCreate: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle(t('log.guildScheduledEventCreate.title', { lng }))
            .setImage(scheduledEvent.coverImageURL({ size: 1024 }))
            .addFields(
              {
                name: t('log.guildScheduledEventCreate.name', { lng }),
                value: name
              },
              {
                name: t('log.guildScheduledEventCreate.description', { lng }),
                value: description || '/'
              },
              {
                name: t('log.guildScheduledEventCreate.url', { lng }),
                value: url
              },
              {
                name: t('log.guildScheduledEventCreate.location', { lng }),
                value: channel ? `${channel.toString()} (\`${channel.name}\` | ${channel.id})` : entityMetadata?.location ? `${entityMetadata?.location}` : '/'
              },
              {
                name: t('log.guildScheduledEventCreate.creator', { lng }),
                value: creator ? `${creator.toString()} (\`${creator.username}\` | ${creator.id})` : '/'
              },
              {
                name: t('log.guildScheduledEventCreate.status', { lng }),
                value: GuildScheduledEventStatus[status]
              },
              {
                name: t('log.guildScheduledEventCreate.privacy-level', { lng }),
                value: GuildScheduledEventPrivacyLevel[privacyLevel]
              },
              {
                name: t('log.guildScheduledEventCreate.start', { lng }),
                value: scheduledStartTimestamp
                  ? `<t:${Math.floor(scheduledStartTimestamp / 1000)}:f> (<t:${Math.floor(scheduledStartTimestamp / 1000)}:R>)`
                  : '/'
              },
              {
                name: t('log.guildScheduledEventCreate.end', { lng }),
                value: scheduledEndTimestamp ? `<t:${Math.floor(scheduledEndTimestamp / 1000)}:f> (<t:${Math.floor(scheduledEndTimestamp / 1000)}:R>)` : '/'
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | GuildScheduledEventCreate: Could not send message'));
  }
});

import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { LoggedEvent } from 'types/guild-log';

export default new Event({
  name: Events.GuildScheduledEventUserAdd,
  once: false,
  async execute(_client, scheduledEvent, user) {
    const guild = scheduledEvent.guild;

    if (!guild) {
      return;
    }

    if (scheduledEvent.partial) {
      await scheduledEvent.fetch().catch((err) => logger.debug({ err }, 'GuildLog | GuildScheduledEventUserAdd: Could not fetch guild scheduled event'));
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as LoggedEvent[] };

    const event = log.events.find((e) => e.name === Events.GuildScheduledEventUserAdd) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels
      .fetch(event.channelId)
      .catch((err) => logger.debug({ err }, 'GuildLog | GuildScheduledEventUserAdd: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle(t('log.guildScheduledEventUserAdd.title', { lng }))
            .setImage(scheduledEvent.coverImageURL({ size: 1024 }))
            .addFields(
              {
                name: t('log.guildScheduledEventUserAdd.event', { lng }),
                value: `[${scheduledEvent.name}](${scheduledEvent.url})`
              },
              {
                name: t('log.guildScheduledEventUserAdd.user', { lng }),
                value: `${user.toString()} (\`${user.username}\` | ${user.id})`
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | GuildScheduledEventUserAdd: Could not send message'));
  }
});

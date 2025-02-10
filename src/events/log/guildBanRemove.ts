import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { LoggedEvent } from 'types/guild-log';

export default new Event({
  name: Events.GuildBanRemove,
  once: false,
  async execute(_client, ban) {
    const details = await ban.fetch().catch((err) => logger.debug({ err }, 'GuildLog | GuildBanRemove: Could not fetch ban'));

    if (!details) {
      return;
    }

    const { guild, user, reason } = details;

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as LoggedEvent[] };

    const event = log.events.find((e) => e.name === Events.GuildBanRemove) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | GuildBanRemove: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle(t('log.guildBanRemove.title', { lng }))
            .addFields(
              {
                name: t('log.guildBanRemove.user', { lng }),
                value: `${user.toString()} (\`${user.username}\` | ${user.id})`
              },
              {
                name: t('log.guildBanRemove.reason', { lng }),
                value: reason || '/'
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | GuildBanRemove: Could not send message'));
  }
});

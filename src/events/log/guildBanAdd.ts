import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { GuildLogEvent } from 'types/guild-log';

export default new Event({
  name: Events.GuildBanAdd,
  once: false,
  async execute(_client, ban) {
    const { guild, user, reason, partial } = ban;

    if (partial) {
      await ban.fetch().catch((err) => logger.debug({ err }, 'GuildLog | GuildBanAdd: Could not fetch ban'));
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as GuildLogEvent[] };

    const event = log.events.find((e) => e.name === Events.GuildBanAdd) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | GuildBanAdd: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle(t('log.guildBanAdd.title', { lng }))
            .addFields(
              {
                name: t('log.guildBanAdd.user', { lng }),
                value: `${user.toString()} (\`${user.username}\` | ${user.id})`
              },
              {
                name: t('log.guildBanAdd.reason', { lng }),
                value: reason || '/'
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | GuildBanAdd: Could not send message'));
  }
});

import { Colors, EmbedBuilder, Events, InviteGuild } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { LoggedEvent } from 'types/guild-log';

export default new Event({
  name: Events.InviteDelete,
  once: false,
  async execute(_client, invite) {
    const { guild, channel, url } = invite;

    if (!guild || guild instanceof InviteGuild) {
      return;
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as LoggedEvent[] };

    const event = log.events.find((e) => e.name === Events.InviteDelete) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | InviteDelete: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle(t('log.inviteDelete.title', { lng }))
            .addFields(
              { name: t('log.inviteDelete.url', { lng }), value: url },
              {
                name: t('log.inviteDelete.channel', { lng }),
                value: channel ? `${channel.toString()} (\`${channel.name}\` | ${channel.id})` : '/'
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | InviteDelete: Could not send message'));
  }
});

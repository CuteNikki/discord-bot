import { Colors, EmbedBuilder, Events, InviteGuild } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { LoggedEvent } from 'types/guild-log';

export default new Event({
  name: Events.InviteCreate,
  once: false,
  async execute(_client, invite) {
    const { guild, inviter, channel, url, expiresTimestamp, temporary, maxUses } = invite;

    if (!guild || guild instanceof InviteGuild) {
      return;
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as LoggedEvent[] };

    const event = log.events.find((e) => e.name === Events.InviteCreate) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | InviteCreate: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle(t('log.inviteCreate.title', { lng }))
            .addFields(
              { name: t('log.inviteCreate.url', { lng }), value: url },
              {
                name: t('log.inviteCreate.expires-at', { lng }),
                value: expiresTimestamp ? `<t:${Math.floor(expiresTimestamp / 1000)}:f>` : 'never'
              },
              {
                name: t('log.inviteCreate.max-uses', { lng }),
                value: `${maxUses || '/'}`
              },
              {
                name: t('log.inviteCreate.temporary-membership', { lng }),
                value: `${temporary ?? '/'}`
              },
              {
                name: t('log.inviteCreate.channel', { lng }),
                value: channel ? `${channel.toString()} (\`${channel.name}\` | ${channel.id})` : '/'
              },
              {
                name: t('log.inviteCreate.created-by', { lng }),
                value: inviter ? `${inviter.toString()} (\`${inviter.username}\` | ${inviter.id})` : '/'
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | InviteCreate: Could not send message'));
  }
});

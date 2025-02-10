import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { LoggedEvent } from 'types/guild-log';

export default new Event({
  name: Events.GuildRoleCreate,
  once: false,
  async execute(_client, role) {
    const { guild, name, id, hexColor, position, hoist, mentionable, managed, unicodeEmoji, permissions } = role;

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as LoggedEvent[] };

    const event = log.events.find((e) => e.name === Events.GuildRoleCreate) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | RoleCreate: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle(t('log.roleCreate.title', { lng }))
            .setThumbnail(role.iconURL({ size: 1024 }))
            .addFields(
              {
                name: t('log.roleCreate.role', { lng }),
                value: `${role.toString()} (\`${name}\` | ${id})`
              },
              { name: t('log.roleCreate.color', { lng }), value: `${hexColor}` },
              {
                name: t('log.roleCreate.position', { lng }),
                value: `${position}`
              },
              {
                name: t('log.roleCreate.displayed-separately', { lng }),
                value: `${hoist}`
              },
              {
                name: t('log.roleCreate.mentionable', { lng }),
                value: `${mentionable}`
              },
              { name: t('log.roleCreate.managed', { lng }), value: `${managed}` },
              {
                name: t('log.roleCreate.emoji', { lng }),
                value: unicodeEmoji || '/'
              },
              {
                name: t('log.roleCreate.permissions', { lng }),
                value:
                  permissions
                    .toArray()
                    .map((perm) => `\`${perm}\``)
                    .join(', ')
                    .slice(0, 1000) || '/'
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | RoleCreate: Could not send message'));
  }
});

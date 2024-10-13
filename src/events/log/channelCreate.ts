import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { GuildLogEvent } from 'types/guild-log';

export default new Event({
  name: Events.ChannelCreate,
  once: false,
  async execute(_client, channel) {
    const { guild, name, id, type, parent, permissionOverwrites } = channel;

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as GuildLogEvent[] };

    const event = log.events.find((e) => e.name === Events.ChannelCreate) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | ChannelCreate: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle(t('log.channelCreate.title', { lng }))
      .addFields(
        {
          name: t('log.channelCreate.channel', { lng }),
          value: `${channel.toString()} (\`${name}\` | ${id})`
        },
        {
          name: t('log.channelCreate.type', { lng }),
          value: ChannelType[type]
        },
        {
          name: t('log.channelCreate.permission-overwrites', { lng }),
          value:
            permissionOverwrites.cache
              .map(
                (permission) =>
                  `<@${permission.type ? '' : '&'}${permission.id}>${
                    permission.allow.toArray().length
                      ? `\n- ${t('log.channelCreate.allowed', { lng })}: ` +
                        permission.allow
                          .toArray()
                          .map((perm) => `\`${perm}\``)
                          .join(', ')
                      : ''
                  }${
                    permission.deny.toArray().length
                      ? `\n- ${t('log.channelCreate.denied', { lng })}: ` +
                        permission.deny
                          .toArray()
                          .map((perm) => `\`${perm}\``)
                          .join(', ')
                      : ''
                  }`
              )
              .join('\n')
              .slice(0, 1000) || '/'
        }
      )
      .setTimestamp();

    if (parent) {
      embed.addFields({
        name: t('log.channelCreate.category', { lng }),
        value: `\`${parent.name}\` (${parent.id})`
      });
    }

    await logChannel
      .send({
        embeds: [embed]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | ChannelCreate: Could not send message'));
  }
});

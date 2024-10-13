import { Colors, EmbedBuilder, Events, StickerFormatType } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { GuildLogEvent } from 'types/guild-log';

export default new Event({
  name: Events.GuildStickerDelete,
  once: false,
  async execute(_client, sticker) {
    const { guild, name, id, url, description, format, tags, createdTimestamp } = sticker;

    if (!guild) {
      return;
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as GuildLogEvent[] };

    const event = log.events.find((e) => e.name === Events.GuildStickerDelete) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | StickerDelete: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle(t('log.stickerDelete.title', { lng }))
            .setThumbnail(url)
            .addFields(
              {
                name: t('log.stickerDelete.sticker', { lng }),
                value: `\`${name}\` (${id})`
              },
              {
                name: t('log.stickerDelete.description', { lng }),
                value: description || '/'
              },
              {
                name: t('log.stickerDelete.format', { lng }),
                value: StickerFormatType[format]
              },
              { name: t('log.stickerDelete.tags', { lng }), value: tags || '/' },
              {
                name: t('log.stickerDelete.created-at', { lng }),
                value: `<t:${Math.floor(createdTimestamp / 1000)}:f>`
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | StickerDelete: Could not send message'));
  }
});

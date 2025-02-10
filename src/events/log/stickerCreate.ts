import { Colors, EmbedBuilder, Events, StickerFormatType } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { LoggedEvent } from 'types/guild-log';

export default new Event({
  name: Events.GuildStickerCreate,
  once: false,
  async execute(_client, sticker) {
    const { guild, name, id, url, description, format, tags } = sticker;

    if (!guild) {
      return;
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as LoggedEvent[] };

    const event = log.events.find((e) => e.name === Events.GuildStickerCreate) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | StickerCreate: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const user = await sticker.user?.fetch().catch((err) => logger.debug({ err }, 'GuildLog | StickerCreate: Could not fetch sticker creator'));

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle(t('log.stickerCreate.title', { lng }))
            .setThumbnail(url)
            .addFields(
              {
                name: t('log.stickerCreate.sticker', { lng }),
                value: `\`${name}\` (${id})`
              },
              {
                name: t('log.stickerCreate.description', { lng }),
                value: description || '/'
              },
              {
                name: t('log.stickerCreate.format', { lng }),
                value: StickerFormatType[format]
              },
              { name: t('log.stickerCreate.tags', { lng }), value: tags || '/' },
              {
                name: t('log.stickerCreate.author', { lng }),
                value: user ? `${user.toString()} (\`${user.username}\` | ${user.id})` : '/'
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | StickerCreate: Could not send message'));
  }
});

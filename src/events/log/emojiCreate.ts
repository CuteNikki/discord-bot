import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { GuildLogEvent } from 'types/guild-log';

export default new Event({
  name: Events.GuildEmojiCreate,
  once: false,
  async execute(_client, emoji) {
    const { guild, name, id, animated, managed, identifier } = emoji;

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as GuildLogEvent[] };

    const event = log.events.find((e) => e.name === Events.GuildEmojiCreate) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | EmojiCreate: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const author = await emoji.fetchAuthor().catch((err) => logger.debug({ err }, 'Could not fetch emoji author'));

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle(t('log.emojiCreate.title', { lng }))
            .setThumbnail(emoji.imageURL({ size: 1024 }))
            .addFields(
              {
                name: t('log.emojiCreate.emoji', { lng }),
                value: `${emoji.toString()} (\`${name}\` | ${id})`
              },
              {
                name: t('log.emojiCreate.author', { lng }),
                value: author ? `${author.toString()} (\`${author.username}\` | ${author.id})` : '/'
              },
              {
                name: t('log.emojiCreate.identifier', { lng }),
                value: `\`${identifier}\``
              },
              {
                name: t('log.emojiCreate.animated', { lng }),
                value: `${animated ?? '/'}`
              },
              {
                name: t('log.emojiCreate.managed', { lng }),
                value: `${managed ?? '/'}`
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | EmojiCreate: Could not send message'));
  }
});

import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildEmojiCreate,
  once: false,
  async execute(client, emoji) {
    const { guild, name, id, animated, managed, identifier } = emoji;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.emojiCreate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const author = await emoji.fetchAuthor().catch((err) => logger.debug({ err }, 'Could not fetch emoji author'));

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle(t('log.emojiCreate.title', { lng }))
          .setThumbnail(emoji.imageURL({ size: 1024 }))
          .addFields(
            {
              name: t('log.emojiCreate.emoji', { lng }),
              value: `${emoji.toString()} (\`${name}\` | ${id})`,
            },
            {
              name: t('log.emojiCreate.author', { lng }),
              value: author ? `${author.toString()} (\`${author.username}\` | ${author.id})` : '/',
            },
            {
              name: t('log.emojiCreate.identifier', { lng }),
              value: `\`${identifier}\``,
            },
            {
              name: t('log.emojiCreate.animated', { lng }),
              value: `${animated ?? '/'}`,
            },
            {
              name: t('log.emojiCreate.managed', { lng }),
              value: `${managed ?? '/'}`,
            },
          )
          .setTimestamp(),
      ],
    });
  },
});

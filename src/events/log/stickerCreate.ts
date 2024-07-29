import { ChannelType, Colors, EmbedBuilder, Events, StickerFormatType } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildStickerCreate,
  once: false,
  async execute(client, sticker) {
    const { guild, name, id, url, description, format, tags } = sticker;
    if (!guild) return;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.stickerCreate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const user = await sticker.user?.fetch().catch((error) => logger.debug({ error }, 'Could not fetch sticker author'));

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle(t('log.stickerCreate.title', { lng }))
          .setThumbnail(url)
          .addFields(
            { name: t('log.stickerCreate.sticker', { lng }), value: `\`${name}\` (${id})` },
            { name: t('log.stickerCreate.description', { lng }), value: description || '/' },
            { name: t('log.stickerCreate.format', { lng }), value: StickerFormatType[format] },
            { name: t('log.stickerCreate.tags', { lng }), value: tags || '/' },
            { name: t('log.stickerCreate.author', { lng }), value: user ? `${user.toString()} (\`${user.username}\` | ${user.id})` : '/' }
          )
          .setTimestamp(),
      ],
    });
  },
});

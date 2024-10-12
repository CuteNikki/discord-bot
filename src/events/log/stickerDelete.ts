import { Colors, EmbedBuilder, Events, StickerFormatType } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuild } from 'db/guild';
import { getGuildLanguage } from 'db/language';

export default new Event({
  name: Events.GuildStickerDelete,
  once: false,
  async execute(_client, sticker) {
    const { guild, name, id, url, description, format, tags, createdTimestamp } = sticker;
    if (!guild) return;

    const config = (await getGuild(guild.id)) ?? { log: { enabled: false } };

    if (!config.log.enabled || !config.log.events.stickerDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = await getGuildLanguage(guild.id);

    await logChannel.send({
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
    });
  }
});

import { ChannelType, Colors, EmbedBuilder, Events, StickerFormatType } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildStickerDelete,
  once: false,
  async execute(client, sticker) {
    const { guild, name, id, url, description, format, tags, createdTimestamp } = sticker;
    if (!guild) return;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.stickerDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const user = await sticker.user?.fetch().catch(() => {});

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('Sticker Delete')
          .setThumbnail(url)
          .addFields(
            { name: 'Sticker', value: `\`${name}\` (${id})` },
            { name: 'Description', value: description || '/' },
            { name: 'Format', value: StickerFormatType[format] },
            { name: 'Tags', value: tags || '/' },
            { name: 'Created at', value: `<t:${Math.floor(createdTimestamp / 1000)}:f>` }
          ),
      ],
    });
  },
});

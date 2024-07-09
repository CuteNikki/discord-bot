import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildEmojiCreate,
  once: false,
  async execute(client, emoji) {
    const { guild, name, id, animated, managed, identifier } = emoji;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.emojiCreate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const author = await emoji.fetchAuthor().catch(() => {});

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('Emoji Create')
          .setThumbnail(emoji.imageURL({ size: 1024 }))
          .addFields(
            { name: 'Emoji', value: `${emoji.toString()} (\`${name}\` | ${id})` },
            { name: 'Author', value: author ? `${author.toString()} (\`${author.username}\` | ${author.id})` : '/' },
            { name: 'Identifier', value: `\`${identifier}\`` },
            { name: 'Animated', value: `${animated ?? '/'}` },
            { name: 'Managed', value: `${managed ?? '/'}` }
          ),
      ],
    });
  },
});

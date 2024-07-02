import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildEmojiDelete,
  once: false,
  async execute(client, emoji) {
    const { guild, name, id, animated, managed, roles, createdTimestamp, identifier, author } = emoji;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.emojiDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('Emoji Delete')
          .setThumbnail(emoji.imageURL({ size: 1024 }))
          .addFields(
            { name: 'Emoji', value: `\`${name}\` (${id})` },
            { name: 'Author', value: author ? `${author.toString()} (\`${author.username}\` | ${author.id})` : '/' },
            { name: 'Created at', value: `<t:${Math.floor(createdTimestamp / 1000)}:f>` },
            { name: 'Identifier', value: `\`${identifier}\`` },
            { name: 'Animated', value: `${animated ?? '/'}` },
            { name: 'Managed', value: `${managed ?? '/'}` },
            {
              name: 'Roles',
              value:
                roles.cache
                  .map((role) => role.toString())
                  .join(', ')
                  .slice(0, 1000) || '/',
            }
          ),
      ],
    });
  },
});

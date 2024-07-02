import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildEmojiUpdate,
  once: false,
  async execute(client, oldEmoji, newEmoji) {
    const guild = newEmoji.guild;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.emojiUpdate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const author = await newEmoji.fetchAuthor().catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle('Emoji Update')
      .setThumbnail(newEmoji.imageURL({ size: 1024 }))
      .addFields(
        { name: 'Emoji', value: `${newEmoji.toString()} (\`${newEmoji.name}\` | ${newEmoji.id})` },
        { name: 'Author', value: author ? `${author.toString()} (\`${author.username}\` | ${author.id})` : '/' }
      );

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newEmoji.name !== oldEmoji.name)
      embed.addFields({ name: 'Old Name', value: `${oldEmoji.name}`, inline: true }, { name: 'New Name', value: `${newEmoji.name}`, inline: true }, emptyField);
    if (JSON.stringify(newEmoji.roles.cache.toJSON()) !== JSON.stringify(oldEmoji.roles.cache.toJSON())) {
      embed.addFields(
        {
          name: 'Old Roles',
          value:
            oldEmoji.roles.cache
              .map((role) => role.toString())
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        {
          name: 'New Roles',
          value:
            newEmoji.roles.cache
              .map((role) => role.toString())
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        emptyField
      );
    }

    await logChannel.send({
      embeds: [embed],
    });
  },
});

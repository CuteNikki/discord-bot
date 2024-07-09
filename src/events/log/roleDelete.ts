import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildRoleDelete,
  once: false,
  async execute(client, role) {
    const { guild, name, id, hexColor, position, hoist, mentionable, managed, unicodeEmoji, permissions, createdTimestamp } = role;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.roleDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!config.log.enabled || !logChannel || logChannel.type !== ChannelType.GuildText) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('Role Delete')
          .setThumbnail(role.iconURL({ size: 1024 }))
          .addFields(
            { name: 'Role', value: `\`${name}\` (${id})` },
            { name: 'Created at', value: `<t:${Math.floor(createdTimestamp / 1000)}:f>` },
            { name: 'Color', value: `${hexColor}` },
            { name: 'Position', value: `${position}` },
            { name: 'Displayed Separately', value: `${hoist}` },
            { name: 'Mentionable', value: `${mentionable}` },
            { name: 'Managed', value: `${managed}` },
            { name: 'Emoji', value: unicodeEmoji || '/' },
            {
              name: 'Permissions',
              value:
                permissions
                  .toArray()
                  .map((perm) => `\`${perm}\``)
                  .join(', ')
                  .slice(0, 1000) || '/',
            }
          ),
      ],
    });
  },
});

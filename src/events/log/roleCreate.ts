import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildRoleCreate,
  once: false,
  async execute(client, role) {
    const { guild, name, id, hexColor, position, hoist, mentionable, managed, unicodeEmoji, permissions } = role;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.roleCreate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!config.log.enabled || !logChannel || logChannel.type !== ChannelType.GuildText) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('Role Create')
          .setThumbnail(role.iconURL({ size: 1024 }))
          .addFields(
            { name: 'Role', value: `${role.toString()} (\`${name}\` | ${id})` },
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

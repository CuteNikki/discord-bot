import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.ChannelDelete,
  once: false,
  async execute(client, channel) {
    if (channel.isDMBased()) return;
    const { guild, name, id, type, parent, createdTimestamp, permissionOverwrites } = channel;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.channelCreate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const embed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle('Channel Delete')
      .addFields(
        { name: 'Channel', value: `${channel.toString()} (\`${name}\` | ${id})` },
        { name: 'Type', value: ChannelType[type] },
        { name: 'Created at', value: `<t:${Math.floor(createdTimestamp / 1000)}:f>` },
        {
          name: 'Permissions',
          value:
            permissionOverwrites.cache
              .map(
                (permission) =>
                  `<@${permission.type ? '' : '&'}${permission.id}>${
                    permission.allow.toArray().length
                      ? `\n- Allowed: ` +
                        permission.allow
                          .toArray()
                          .map((perm) => `\`${perm}\``)
                          .join(', ')
                      : ''
                  }${
                    permission.deny.toArray().length
                      ? `\n- Denied: ` +
                        permission.deny
                          .toArray()
                          .map((perm) => `\`${perm}\``)
                          .join(', ')
                      : ''
                  }`
              )
              .join('\n')
              .slice(0, 1000) || '/',
        }
      );

    if (parent) embed.addFields({ name: 'Category', value: `\`${parent.name}\` (${parent.id})` });

    await logChannel.send({
      embeds: [embed],
    });
  },
});

import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

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

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle(t('log.roleCreate.title', { lng }))
          .setThumbnail(role.iconURL({ size: 1024 }))
          .addFields(
            { name: t('log.roleCreate.role', { lng }), value: `${role.toString()} (\`${name}\` | ${id})` },
            { name: t('log.roleCreate.color', { lng }), value: `${hexColor}` },
            { name: t('log.roleCreate.position', { lng }), value: `${position}` },
            { name: t('log.roleCreate.displayed_separately', { lng }), value: `${hoist}` },
            { name: t('log.roleCreate.mentionable', { lng }), value: `${mentionable}` },
            { name: t('log.roleCreate.managed', { lng }), value: `${managed}` },
            { name: t('log.roleCreate.emoji', { lng }), value: unicodeEmoji || '/' },
            {
              name: t('log.roleCreate.permissions', { lng }),
              value:
                permissions
                  .toArray()
                  .map((perm) => `\`${perm}\``)
                  .join(', ')
                  .slice(0, 1000) || '/',
            }
          )
          .setTimestamp(),
      ],
    });
  },
});

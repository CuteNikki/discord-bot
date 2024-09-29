import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildSettings } from 'db/guild';

export default new Event({
  name: Events.GuildRoleCreate,
  once: false,
  async execute(_client, role) {
    const { guild, name, id, hexColor, position, hoist, mentionable, managed, unicodeEmoji, permissions } = role;

    const config = await getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.roleCreate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle(t('log.roleCreate.title', { lng }))
          .setThumbnail(role.iconURL({ size: 1024 }))
          .addFields(
            {
              name: t('log.roleCreate.role', { lng }),
              value: `${role.toString()} (\`${name}\` | ${id})`
            },
            { name: t('log.roleCreate.color', { lng }), value: `${hexColor}` },
            {
              name: t('log.roleCreate.position', { lng }),
              value: `${position}`
            },
            {
              name: t('log.roleCreate.displayed_separately', { lng }),
              value: `${hoist}`
            },
            {
              name: t('log.roleCreate.mentionable', { lng }),
              value: `${mentionable}`
            },
            { name: t('log.roleCreate.managed', { lng }), value: `${managed}` },
            {
              name: t('log.roleCreate.emoji', { lng }),
              value: unicodeEmoji || '/'
            },
            {
              name: t('log.roleCreate.permissions', { lng }),
              value:
                permissions
                  .toArray()
                  .map((perm) => `\`${perm}\``)
                  .join(', ')
                  .slice(0, 1000) || '/'
            }
          )
          .setTimestamp()
      ]
    });
  }
});

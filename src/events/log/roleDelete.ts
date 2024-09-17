import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildSettings } from 'db/guild';

export default new Event({
  name: Events.GuildRoleDelete,
  once: false,
  async execute(_client, role) {
    const { guild, name, id, hexColor, position, hoist, mentionable, managed, unicodeEmoji, permissions, createdTimestamp } = role;

    const config = await getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.roleDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle(t('log.roleDelete.title', { lng }))
          .setThumbnail(role.iconURL({ size: 1024 }))
          .addFields(
            {
              name: t('log.roleDelete.role', { lng }),
              value: `\`${name}\` (${id})`,
            },
            {
              name: t('log.roleDelete.created_at', { lng }),
              value: `<t:${Math.floor(createdTimestamp / 1000)}:f>`,
            },
            { name: t('log.roleDelete.color', { lng }), value: `${hexColor}` },
            {
              name: t('log.roleDelete.position', { lng }),
              value: `${position}`,
            },
            {
              name: t('log.roleDelete.displayed_separately', { lng }),
              value: `${hoist}`,
            },
            {
              name: t('log.roleDelete.mentionable', { lng }),
              value: `${mentionable}`,
            },
            { name: t('log.roleDelete.managed', { lng }), value: `${managed}` },
            {
              name: t('log.roleDelete.emoji', { lng }),
              value: unicodeEmoji || '/',
            },
            {
              name: t('log.roleDelete.permissions', { lng }),
              value:
                permissions
                  .toArray()
                  .map((perm) => `\`${perm}\``)
                  .join(', ')
                  .slice(0, 1000) || '/',
            },
          )
          .setTimestamp(),
      ],
    });
  },
});

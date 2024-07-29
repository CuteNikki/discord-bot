import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

export default new Event({
  name: Events.ChannelCreate,
  once: false,
  async execute(client, channel) {
    const { guild, name, id, type, parent, permissionOverwrites } = channel;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.channelCreate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const lng = config.language;

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle(t('log.channelCreate.title', { lng }))
      .addFields(
        { name: t('log.channelCreate.channel', { lng }), value: `${channel.toString()} (\`${name}\` | ${id})` },
        { name: t('log.channelCreate.type', { lng }), value: ChannelType[type] },
        {
          name: t('log.channelCreate.permission_overwrites', { lng }),
          value:
            permissionOverwrites.cache
              .map(
                (permission) =>
                  `<@${permission.type ? '' : '&'}${permission.id}>${
                    permission.allow.toArray().length
                      ? `\n- ${t('log.channelCreate.allowed', { lng })}: ` +
                        permission.allow
                          .toArray()
                          .map((perm) => `\`${perm}\``)
                          .join(', ')
                      : ''
                  }${
                    permission.deny.toArray().length
                      ? `\n- ${t('log.channelCreate.denied', { lng })}: ` +
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
      )
      .setTimestamp();

    if (parent) embed.addFields({ name: t('log.channelCreate.category', { lng }), value: `\`${parent.name}\` (${parent.id})` });

    await logChannel.send({
      embeds: [embed],
    });
  },
});

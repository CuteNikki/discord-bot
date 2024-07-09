import { ApplicationCommandPermissionType, ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.ApplicationCommandPermissionsUpdate,
  once: false,
  async execute(client, data) {
    const { applicationId, guildId, id, permissions } = data;

    const config = await client.getGuildSettings(guildId);

    if (!config.log.enabled || !config.log.events.applicationCommandPermissionsUpdate || !config.log.channelId) return;

    const guild = await client.guilds.fetch(guildId).catch(() => {});
    if (!guild) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Yellow)
          .setTitle('Application Command Permissions Update')
          .addFields(
            { name: 'Application', value: `<@${applicationId}>` },
            { name: 'Command ID', value: `${id}` },
            {
              name: 'Updated Permissions',
              value:
                permissions
                  .map(
                    (permission) =>
                      `${permission.type === 1 ? `<@&${permission.id}>` : permission.type === 2 ? `<@${permission.id}>` : `<#${permission.id}>`} (${
                        ApplicationCommandPermissionType[permission.type]
                      }): ${permission.permission}`
                  )
                  .join('\n') || '/',
            }
          ),
      ],
    });
  },
});

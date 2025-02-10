import { ApplicationCommandPermissionType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { LoggedEvent } from 'types/guild-log';

export default new Event({
  name: Events.ApplicationCommandPermissionsUpdate,
  once: false,
  async execute(client, data) {
    const { applicationId, guildId, id, permissions } = data;

    const log = (await getGuildLog(guildId)) ?? { enabled: false, events: [] as LoggedEvent[] };

    const event = log.events.find((e) => e.name === Events.ApplicationCommandPermissionsUpdate) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const guild = await client.guilds
      .fetch(guildId)
      .catch((err) => logger.debug({ err, guildId }, 'GuildLog | ApplicationCommandPermissionsUpdate: Could not fetch guild'));

    if (!guild) {
      return;
    }

    const logChannel = await guild.channels
      .fetch(event.channelId)
      .catch((err) => logger.debug({ err }, 'GuildLog | ApplicationCommandPermissionsUpdate: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guildId);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setTitle(t('log.applicationCommandPermissionsUpdate.title', { lng }))
            .addFields(
              {
                name: t('log.applicationCommandPermissionsUpdate.application', {
                  lng
                }),
                value: `<@${applicationId}>`
              },
              {
                name: t('log.applicationCommandPermissionsUpdate.command-id', {
                  lng
                }),
                value: `${id}`
              },
              {
                name: t('log.applicationCommandPermissionsUpdate.updated-permissions', { lng }),
                value:
                  permissions
                    .map(
                      (permission) =>
                        `${permission.type === 1 ? `<@&${permission.id}>` : permission.type === 2 ? `<@${permission.id}>` : `<#${permission.id}>`} (${
                          ApplicationCommandPermissionType[permission.type]
                        }): ${permission.permission}`
                    )
                    .join('\n') || '/'
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | ApplicationCommandPermissionsUpdate: Could not send message'));
  }
});

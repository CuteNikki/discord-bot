import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { GuildLogEvent } from 'types/guild-log';

export default new Event({
  name: Events.GuildRoleUpdate,
  once: false,
  async execute(_client, oldRole, newRole) {
    const guild = newRole.guild;

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as GuildLogEvent[] };

    const event = log.events.find((e) => e.name === Events.GuildRoleUpdate) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | RoleUpdate: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.roleUpdate.title', { lng }))
      .setThumbnail(newRole.iconURL({ size: 1024 }))
      .addFields({
        name: t('log.roleUpdate.role', { lng }),
        value: `${newRole.toString()} (\`${newRole.name}\` | ${newRole.id})`
      })
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newRole.name !== oldRole.name) {
      embed.addFields(
        {
          name: t('log.roleUpdate.old-name', { lng }),
          value: oldRole.name,
          inline: true
        },
        {
          name: t('log.roleUpdate.new-name', { lng }),
          value: newRole.name,
          inline: true
        },
        emptyField
      );
    }

    if (newRole.hexColor !== oldRole.hexColor) {
      embed.addFields(
        {
          name: t('log.roleUpdate.old-color', { lng }),
          value: oldRole.hexColor,
          inline: true
        },
        {
          name: t('log.roleUpdate.new-color', { lng }),
          value: newRole.hexColor,
          inline: true
        },
        emptyField
      );
    }

    if (newRole.hoist !== oldRole.hoist) {
      embed.addFields(
        {
          name: t('log.roleUpdate.old-displayed-separately', { lng }),
          value: `${oldRole.hoist}`,
          inline: true
        },
        {
          name: t('log.roleUpdate.new-displayed-separately', { lng }),
          value: `${newRole.hoist}`,
          inline: true
        },
        emptyField
      );
    }

    if (newRole.mentionable !== oldRole.mentionable) {
      embed.addFields(
        {
          name: t('log.roleUpdate.old-mentionable', { lng }),
          value: `${oldRole.mentionable}`,
          inline: true
        },
        {
          name: t('log.roleUpdate.new-mentionable', { lng }),
          value: `${newRole.mentionable}`,
          inline: true
        },
        emptyField
      );
    }

    if (newRole.unicodeEmoji !== oldRole.unicodeEmoji) {
      embed.addFields(
        {
          name: t('log.roleUpdate.old-emoji', { lng }),
          value: `${oldRole.unicodeEmoji}`,
          inline: true
        },
        {
          name: t('log.roleUpdate.new-emoji', { lng }),
          value: `${newRole.unicodeEmoji}`,
          inline: true
        },
        emptyField
      );
    }

    if (newRole.permissions.bitfield !== oldRole.permissions.bitfield) {
      const removedPerms = newRole.permissions.toArray().filter((perm) => !oldRole.permissions.toArray().includes(perm));
      const addedPerms = oldRole.permissions.toArray().filter((perm) => !newRole.permissions.toArray().includes(perm));

      embed.addFields(
        {
          name: t('log.roleUpdate.removed-permissions', { lng }),
          value:
            removedPerms
              .map((perm) => `\`${perm}\``)
              .join(', ')
              .slice(0, 1000) || '/'
        },
        {
          name: t('log.roleUpdate.added-permissions', { lng }),
          value:
            addedPerms
              .map((perm) => `\`${perm}\``)
              .join(', ')
              .slice(0, 1000) || '/'
        },
        emptyField
      );
    }

    const embedData = embed.toJSON();

    if (!embedData.fields?.length || embedData.fields.length > 25 || embedData.fields.length <= 1) {
      return;
    }

    await logChannel.send({ embeds: [embed] }).catch((err) => logger.debug({ err }, 'GuildLog | RoleUpdate: Could not send message'));
  }
});

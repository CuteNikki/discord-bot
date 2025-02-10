import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { LoggedEvent } from 'types/guild-log';

export default new Event({
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(_client, oldMember, newMember) {
    const guild = newMember.guild;

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as LoggedEvent[] };

    const event = log.events.find((e) => e.name === Events.GuildMemberUpdate) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels
      .fetch(event.channelId)
      .catch((err) => logger.debug({ err }, 'GuildLog | GuildMemberUpdate: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.guildMemberUpdate.title', { lng }))
      .addFields({
        name: t('log.guildMemberUpdate.member', { lng }),
        value: `${newMember.toString()} (\`${newMember.user.username}\` | ${newMember.user.id})`
      })
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newMember.nickname !== oldMember.nickname) {
      embed.addFields(
        {
          name: t('log.guildMemberUpdate.old-nickname', { lng }),
          value: oldMember.nickname ?? oldMember.displayName,
          inline: true
        },
        {
          name: t('log.guildMemberUpdate.new-nickname', { lng }),
          value: newMember.nickname ?? newMember.displayName,
          inline: true
        },
        emptyField
      );
    }

    if (newMember.displayAvatarURL() !== oldMember.displayAvatarURL()) {
      embed.addFields(
        {
          name: t('log.guildMemberUpdate.old-avatar', { lng }),
          value: oldMember.displayAvatarURL(),
          inline: true
        },
        {
          name: t('log.guildMemberUpdate.new-avatar', { lng }),
          value: newMember.displayAvatarURL(),
          inline: true
        },
        emptyField
      );
    }

    if (newMember.pending !== oldMember.pending) {
      embed.addFields(
        {
          name: t('log.guildMemberUpdate.old-pending', { lng }),
          value: `${oldMember.pending}`,
          inline: true
        },
        {
          name: t('log.guildMemberUpdate.new-pending', { lng }),
          value: `${newMember.pending}`,
          inline: true
        },
        emptyField
      );
    }

    if (newMember.communicationDisabledUntilTimestamp !== oldMember.communicationDisabledUntilTimestamp) {
      embed.addFields(
        {
          name: t('log.guildMemberUpdate.old-timeout', { lng }),
          value: oldMember.communicationDisabledUntilTimestamp ? `<t:${Math.floor(oldMember.communicationDisabledUntilTimestamp / 1000)}:f>` : '/',
          inline: true
        },
        {
          name: t('log.guildMemberUpdate.new-timeout', { lng }),
          value: newMember.communicationDisabledUntilTimestamp ? `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:f>` : '/',
          inline: true
        },
        emptyField
      );
    }

    if (JSON.stringify(newMember.roles.cache.toJSON()) !== JSON.stringify(oldMember.roles.cache.toJSON())) {
      const removedRoles = oldMember.roles.cache.map((r) => r).filter((role) => !newMember.roles.cache.map((r) => r.id).includes(role.id));
      const addedRoles = newMember.roles.cache.map((r) => r).filter((role) => !oldMember.roles.cache.map((r) => r.id).includes(role.id));

      embed.addFields(
        {
          name: t('log.guildMemberUpdate.removed-roles', { lng }),
          value:
            removedRoles
              .map((role) => role.toString())
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true
        },
        {
          name: t('log.guildMemberUpdate.added-roles', { lng }),
          value:
            addedRoles
              .map((role) => role.toString())
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true
        },
        emptyField
      );
    }

    if (newMember.permissions.bitfield !== oldMember.permissions.bitfield) {
      const removedPerms = oldMember.permissions.toArray().filter((perm) => !newMember.permissions.toArray().includes(perm));
      const addedPerms = newMember.permissions.toArray().filter((perm) => !oldMember.permissions.toArray().includes(perm));

      embed.addFields(
        {
          name: t('log.guildMemberUpdate.removed-permissions', { lng }),
          value:
            removedPerms
              .map((perm) => `\`${perm}\``)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true
        },
        {
          name: t('log.guildMemberUpdate.added-permissions', { lng }),
          value:
            addedPerms
              .map((perm) => `\`${perm}\``)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true
        },
        emptyField
      );
    }

    const embedData = embed.toJSON();

    if (!embedData.fields?.length || embedData.fields.length > 25 || embedData.fields.length <= 1) {
      return;
    }

    await logChannel
      .send({
        embeds: [embed]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | GuildMemberUpdate: Could not send message'));
  }
});

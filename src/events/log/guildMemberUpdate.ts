import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(client, oldMember, newMember) {
    const guild = newMember.guild;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.guildMemberUpdate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = config.language;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.guildMemberUpdate.title', { lng }))
      .addFields({
        name: t('log.guildMemberUpdate.member', { lng }),
        value: `${newMember.toString()} (\`${newMember.user.username}\` | ${newMember.user.id})`,
      })
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newMember.nickname !== oldMember.nickname)
      embed.addFields(
        {
          name: t('log.guildMemberUpdate.old_nickname', { lng }),
          value: oldMember.nickname ?? oldMember.displayName,
          inline: true,
        },
        {
          name: t('log.guildMemberUpdate.new_nickname', { lng }),
          value: newMember.nickname ?? newMember.displayName,
          inline: true,
        },
        emptyField,
      );
    if (newMember.displayAvatarURL() !== oldMember.displayAvatarURL())
      embed.addFields(
        {
          name: t('log.guildMemberUpdate.old_avatar', { lng }),
          value: oldMember.displayAvatarURL(),
          inline: true,
        },
        {
          name: t('log.guildMemberUpdate.new_avatar', { lng }),
          value: newMember.displayAvatarURL(),
          inline: true,
        },
        emptyField,
      );
    if (newMember.pending !== oldMember.pending)
      embed.addFields(
        {
          name: t('log.guildMemberUpdate.old_pending', { lng }),
          value: `${oldMember.pending}`,
          inline: true,
        },
        {
          name: t('log.guildMemberUpdate.new_pending', { lng }),
          value: `${newMember.pending}`,
          inline: true,
        },
        emptyField,
      );
    if (newMember.communicationDisabledUntilTimestamp !== oldMember.communicationDisabledUntilTimestamp)
      embed.addFields(
        {
          name: t('log.guildMemberUpdate.old_timeout', { lng }),
          value: oldMember.communicationDisabledUntilTimestamp ? `<t:${Math.floor(oldMember.communicationDisabledUntilTimestamp / 1000)}:f>` : '/',
          inline: true,
        },
        {
          name: t('log.guildMemberUpdate.new_timeout', { lng }),
          value: newMember.communicationDisabledUntilTimestamp ? `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:f>` : '/',
          inline: true,
        },
        emptyField,
      );
    if (JSON.stringify(newMember.roles.cache.toJSON()) !== JSON.stringify(oldMember.roles.cache.toJSON())) {
      const removedRoles = oldMember.roles.cache.map((r) => r).filter((role) => !newMember.roles.cache.map((r) => r.id).includes(role.id));
      const addedRoles = newMember.roles.cache.map((r) => r).filter((role) => !oldMember.roles.cache.map((r) => r.id).includes(role.id));

      embed.addFields(
        {
          name: t('log.guildMemberUpdate.removed_roles', { lng }),
          value:
            removedRoles
              .map((role) => role.toString())
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        {
          name: t('log.guildMemberUpdate.added_roles', { lng }),
          value:
            addedRoles
              .map((role) => role.toString())
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        emptyField,
      );
    }
    if (newMember.permissions.bitfield !== oldMember.permissions.bitfield) {
      const removedPerms = oldMember.permissions.toArray().filter((perm) => !newMember.permissions.toArray().includes(perm));
      const addedPerms = newMember.permissions.toArray().filter((perm) => !oldMember.permissions.toArray().includes(perm));

      embed.addFields(
        {
          name: t('log.guildMemberUpdate.removed_permissions', { lng }),
          value:
            removedPerms
              .map((perm) => `\`${perm}\``)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        {
          name: t('log.guildMemberUpdate.added_permissions', { lng }),
          value:
            addedPerms
              .map((perm) => `\`${perm}\``)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        emptyField,
      );
    }

    const embedData = embed.toJSON();
    if (!embedData.fields?.length || embedData.fields.length > 25 || embedData.fields.length <= 1) return;

    await logChannel.send({
      embeds: [embed],
    });
  },
});

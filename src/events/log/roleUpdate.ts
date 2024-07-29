import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildRoleUpdate,
  once: false,
  async execute(client, oldRole, newRole) {
    const guild = newRole.guild;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.roleUpdate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const lng = config.language;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.roleUpdate.title', { lng }))
      .setThumbnail(newRole.iconURL({ size: 1024 }))
      .addFields({
        name: t('log.roleUpdate.role', { lng }),
        value: `${newRole.toString()} (\`${newRole.name}\` | ${newRole.id})`,
      })
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newRole.name !== oldRole.name)
      embed.addFields(
        {
          name: t('log.roleUpdate.old_name', { lng }),
          value: oldRole.name,
          inline: true,
        },
        {
          name: t('log.roleUpdate.new_name', { lng }),
          value: newRole.name,
          inline: true,
        },
        emptyField,
      );
    if (newRole.hexColor !== oldRole.hexColor)
      embed.addFields(
        {
          name: t('log.roleUpdate.old_color', { lng }),
          value: oldRole.hexColor,
          inline: true,
        },
        {
          name: t('log.roleUpdate.new_color', { lng }),
          value: newRole.hexColor,
          inline: true,
        },
        emptyField,
      );
    if (newRole.hoist !== oldRole.hoist)
      embed.addFields(
        {
          name: t('log.roleUpdate.old_displayed_separately', { lng }),
          value: `${oldRole.hoist}`,
          inline: true,
        },
        {
          name: t('log.roleUpdate.new_displayed_separately', { lng }),
          value: `${newRole.hoist}`,
          inline: true,
        },
        emptyField,
      );
    if (newRole.mentionable !== oldRole.mentionable)
      embed.addFields(
        {
          name: t('log.roleUpdate.old_mentionable', { lng }),
          value: `${oldRole.mentionable}`,
          inline: true,
        },
        {
          name: t('log.roleUpdate.new_mentionable', { lng }),
          value: `${newRole.mentionable}`,
          inline: true,
        },
        emptyField,
      );
    if (newRole.unicodeEmoji !== oldRole.unicodeEmoji)
      embed.addFields(
        {
          name: t('log.roleUpdate.old_emoji', { lng }),
          value: `${oldRole.unicodeEmoji}`,
          inline: true,
        },
        {
          name: t('log.roleUpdate.new_emoji', { lng }),
          value: `${newRole.unicodeEmoji}`,
          inline: true,
        },
        emptyField,
      );
    if (newRole.permissions.bitfield !== oldRole.permissions.bitfield) {
      const removedPerms = newRole.permissions.toArray().filter((perm) => !oldRole.permissions.toArray().includes(perm));
      const addedPerms = oldRole.permissions.toArray().filter((perm) => !newRole.permissions.toArray().includes(perm));
      embed.addFields(
        {
          name: t('log.roleUpdate.removed_permissions', { lng }),
          value:
            removedPerms
              .map((perm) => `\`${perm}\``)
              .join(', ')
              .slice(0, 1000) || '/',
        },
        {
          name: t('log.roleUpdate.added_permissions', { lng }),
          value:
            addedPerms
              .map((perm) => `\`${perm}\``)
              .join(', ')
              .slice(0, 1000) || '/',
        },
        emptyField,
      );
    }

    const embedData = embed.toJSON();
    if (!embedData.fields?.length || embedData.fields.length > 25 || embedData.fields.length <= 1) return;

    await logChannel.send({ embeds: [embed] });
  },
});

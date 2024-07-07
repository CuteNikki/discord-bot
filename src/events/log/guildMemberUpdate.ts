import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(client, oldMember, newMember) {
    const guild = newMember.guild;
    if (oldMember.partial) await oldMember.fetch().catch(() => {});

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.guildMemberUpdate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle('Guild Member Update')
      .addFields({ name: 'Member', value: `${newMember.toString()} (\`${newMember.user.username}\` | ${newMember.user.id})` });

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newMember.nickname !== oldMember.nickname)
      embed.addFields(
        { name: 'Old Nickname', value: oldMember.nickname || oldMember.displayName, inline: true },
        { name: 'New Nickname', value: newMember.nickname || newMember.displayName, inline: true },
        emptyField
      );
    if (newMember.displayAvatarURL() !== oldMember.displayAvatarURL())
      embed.addFields(
        { name: 'Old Avatar', value: oldMember.displayAvatarURL(), inline: true },
        { name: 'New Avatar', value: newMember.displayAvatarURL(), inline: true },
        emptyField
      );
    if (newMember.pending !== oldMember.pending)
      embed.addFields(
        { name: 'Old Pending', value: `${oldMember.pending}`, inline: true },
        { name: 'New Pending', value: `${newMember.pending}`, inline: true },
        emptyField
      );
    if (newMember.communicationDisabledUntilTimestamp !== oldMember.communicationDisabledUntilTimestamp)
      embed.addFields(
        {
          name: 'Old Timeout',
          value: oldMember.communicationDisabledUntilTimestamp ? `<t:${Math.floor(oldMember.communicationDisabledUntilTimestamp / 1000)}:f>` : '/',
          inline: true,
        },
        {
          name: 'New Timeout',
          value: newMember.communicationDisabledUntilTimestamp ? `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:f>` : '/',
          inline: true,
        },
        emptyField
      );
    if (JSON.stringify(newMember.roles.cache.toJSON()) !== JSON.stringify(oldMember.roles.cache.toJSON())) {
      const removedRoles = oldMember.roles.cache.toJSON().filter((role) => !newMember.roles.cache.map((r) => r.id).includes(role.id));
      const addedRoles = newMember.roles.cache.toJSON().filter((role) => !oldMember.roles.cache.map((r) => r.id).includes(role.id));

      embed.addFields(
        {
          name: 'Removed Roles',
          value:
            removedRoles
              .map((role) => role.toString())
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        {
          name: 'Added Roles',
          value:
            addedRoles
              .map((role) => role.toString())
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        emptyField
      );
    }
    if (newMember.permissions.bitfield !== oldMember.permissions.bitfield) {
      const removedPerms = oldMember.permissions.toArray().filter((perm) => !newMember.permissions.toArray().includes(perm));
      const addedPerms = newMember.permissions.toArray().filter((perm) => !oldMember.permissions.toArray().includes(perm));

      embed.addFields(
        {
          name: 'Removed Permissions',
          value:
            removedPerms
              .map((perm) => `\`${perm}\``)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        {
          name: 'Added Permissions',
          value:
            addedPerms
              .map((perm) => `\`${perm}\``)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        emptyField
      );
    }

    const embedData = embed.toJSON();
    if (!embedData.fields?.length || embedData.fields.length > 25 || embedData.fields.length <= 1) return;

    await logChannel.send({
      embeds: [embed],
    });
  },
});

import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildRoleUpdate,
  once: false,
  async execute(client, oldRole, newRole) {
    const guild = newRole.guild;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.roleUpdate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle('Role Update')
      .setThumbnail(newRole.iconURL({ size: 1024 }))
      .addFields({ name: 'Role', value: `${newRole.toString()} (\`${newRole.name}\` | ${newRole.id})` });

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newRole.name !== oldRole.name)
      embed.addFields({ name: 'Old Name', value: oldRole.name, inline: true }, { name: 'New Name', value: newRole.name, inline: true }, emptyField);
    if (newRole.hexColor !== oldRole.hexColor)
      embed.addFields({ name: 'Old Color', value: oldRole.hexColor, inline: true }, { name: 'New Color', value: newRole.hexColor, inline: true }, emptyField);
    if (newRole.hoist !== oldRole.hoist)
      embed.addFields(
        { name: 'Old Displayed Separately', value: `${oldRole.hoist}`, inline: true },
        { name: 'New Displayed Separately', value: `${newRole.hexColor}`, inline: true },
        emptyField
      );
    if (newRole.mentionable !== oldRole.mentionable)
      embed.addFields(
        { name: 'Old Mentionable', value: `${oldRole.mentionable}`, inline: true },
        { name: 'New Mentionable', value: `${newRole.mentionable}`, inline: true },
        emptyField
      );
    if (newRole.unicodeEmoji !== oldRole.unicodeEmoji)
      embed.addFields(
        { name: 'Old Emoji', value: `${oldRole.unicodeEmoji}`, inline: true },
        { name: 'New Emoji', value: `${newRole.unicodeEmoji}`, inline: true },
        emptyField
      );
    if (newRole.permissions.bitfield !== oldRole.permissions.bitfield) {
      const removedPerms = newRole.permissions.toArray().filter((perm) => !oldRole.permissions.toArray().includes(perm));
      const addedPerms = oldRole.permissions.toArray().filter((perm) => !newRole.permissions.toArray().includes(perm));
      embed.addFields(
        {
          name: 'Removed Permissions',
          value:
            removedPerms
              .map((perm) => `\`${perm}\``)
              .join(', ')
              .slice(0, 1000) || '/',
        },
        {
          name: 'Added Permissions',
          value:
            addedPerms
              .map((perm) => `\`${perm}\``)
              .join(', ')
              .slice(0, 1000) || '/',
        },
        emptyField
      );
    }

    const embedData = embed.toJSON();
    if (!embedData.fields?.length || embedData.fields.length > 25 || embedData.fields.length <= 1) return;

    await logChannel.send({ embeds: [embed] });
  },
});

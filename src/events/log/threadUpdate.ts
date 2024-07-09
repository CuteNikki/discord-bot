import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.ThreadUpdate,
  once: false,
  async execute(client, oldThread, newThread) {
    const guild = newThread.guild;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.threadUpdate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!config.log.enabled || !logChannel || logChannel.type !== ChannelType.GuildText) return;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle('Thread Update')
      .addFields({ name: 'Thread', value: `${newThread.toString()} (\`${newThread.name}\` | ${newThread.id})` });

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newThread.name !== oldThread.name)
      embed.addFields({ name: 'Old Name', value: oldThread.name, inline: true }, { name: 'New Name', value: newThread.name, inline: true }, emptyField);
    if (newThread.locked !== oldThread.locked)
      embed.addFields(
        { name: 'Old Locked', value: `${oldThread.locked}`, inline: true },
        { name: 'New Locked', value: `${newThread.locked}`, inline: true },
        emptyField
      );
    if (newThread.archived !== oldThread.archived)
      embed.addFields(
        { name: 'Old Archived', value: `${oldThread.archived}`, inline: true },
        { name: 'New Archived', value: `${newThread.archived}`, inline: true },
        emptyField
      );
    if (newThread.archiveTimestamp !== oldThread.archiveTimestamp)
      embed.addFields(
        { name: 'Old Archived at', value: oldThread.archiveTimestamp ? `<t:${Math.floor(oldThread.archiveTimestamp / 1000)}:f>` : '/', inline: true },
        { name: 'New Archived at', value: newThread.archiveTimestamp ? `<t:${Math.floor(newThread.archiveTimestamp / 1000)}:f>` : '/', inline: true },
        emptyField
      );
    if (JSON.stringify(newThread.appliedTags) !== JSON.stringify(oldThread.appliedTags))
      embed.addFields(
        { name: 'Old Applied Tags', value: oldThread.appliedTags.join('\n').slice(0, 1000) || '/', inline: true },
        { name: 'New Applied Tags', value: newThread.appliedTags.join('\n').slice(0, 1000) || '/', inline: true },
        emptyField
      );
    if (JSON.stringify(newThread.members.cache.toJSON()) !== JSON.stringify(oldThread.members.cache.toJSON())) {
      const addedMembers = newThread.members.cache.toJSON().filter((member) => !oldThread.members.cache.map((mem) => mem.id).includes(member.id));
      const removedMembers = oldThread.members.cache.toJSON().filter((member) => !newThread.members.cache.map((mem) => mem.id).includes(member.id));
      embed.addFields(
        {
          name: 'Added Members',
          value:
            addedMembers
              .map((member) => `<@${member.id}> (\`${member.user?.username}\` | ${member.user?.id})`)
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true,
        },
        {
          name: 'Removed Members',
          value:
            removedMembers
              .map((member) => `<@${member.id}> (\`${member.user?.username}\` | ${member.user?.id})`)
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true,
        },
        emptyField
      );
    }

    const embedData = embed.toJSON();
    if (!embedData.fields?.length || embedData.fields.length > 25) return;

    await logChannel.send({ embeds: [embed] });
  },
});

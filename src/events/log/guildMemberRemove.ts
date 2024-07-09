import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildMemberRemove,
  once: false,
  async execute(client, member) {
    const { guild, user, partial, joinedTimestamp } = member;
    if (partial) await member.fetch().catch(() => {});

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.guildMemberRemove || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('Guild Member Remove')
          .addFields(
            { name: 'Member', value: `${user.toString()} (\`${user.username}\` | ${user.id})` },
            { name: 'Created at', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:f> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)` },
            { name: 'Joined at', value: `<t:${Math.floor((joinedTimestamp || 0) / 1000)}:f> (<t:${Math.floor((joinedTimestamp || 0) / 1000)}:R>)` }
          ),
      ],
    });
  },
});

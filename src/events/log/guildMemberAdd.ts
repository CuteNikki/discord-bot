import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildMemberAdd,
  once: false,
  async execute(client, member) {
    const { guild, user, partial } = member;
    if (partial) await member.fetch().catch(() => {});

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.guildMemberAdd || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('Guild Member Add')
          .addFields(
            { name: 'Member', value: `${user.toString()} (\`${user.username}\` | ${user.id})` },
            { name: 'Created at', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:f> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)` }
          ),
      ],
    });
  },
});

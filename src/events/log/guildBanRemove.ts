import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildBanRemove,
  once: false,
  async execute(client, ban) {
    const { guild, user, reason, partial } = ban;
    if (partial) await ban.fetch().catch(() => {});

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.guildBanRemove || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('Guild Ban Remove')
          .addFields({ name: 'User', value: `${user.toString()} (\`${user.username}\` | ${user.id})` }, { name: 'Reason', value: reason || '/' }),
      ],
    });
  },
});

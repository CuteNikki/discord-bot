import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildScheduledEventUserAdd,
  once: false,
  async execute(client, event, user) {
    if (event.partial) await event.fetch().catch(() => {});
    const guild = event.guild;
    if (!guild) return;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.guildScheduledEventUserAdd || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('Guild Scheduled Event User Add')
          .setImage(event.coverImageURL({ size: 1024 }))
          .addFields(
            { name: 'Event', value: `[${event.name}](${event.url})` },
            { name: 'User', value: `${user.toString()} (\`${user.username}\` | ${user.id})` }
          ),
      ],
    });
  },
});
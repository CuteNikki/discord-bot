import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildScheduledEventDelete,
  once: false,
  async execute(client, event) {
    const { guild, name, creator, description, scheduledStartTimestamp, scheduledEndTimestamp, url, createdTimestamp, channel, entityMetadata } = event;
    if (!guild) return;
    if (event.partial) await event.fetch().catch(() => {});

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.guildScheduledEventDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('Guild Scheduled Event Delete')
          .setImage(event.coverImageURL({ size: 1024 }))
          .addFields(
            { name: 'Name', value: name || '/' },
            { name: 'Description', value: description || '/' },
            { name: 'URL', value: url },
            {
              name: 'Location',
              value: channel ? `${channel.toString()} (\`${channel.name}\` | ${channel.id})` : entityMetadata?.location ? `${entityMetadata?.location}` : '/',
            },
            { name: 'Creator', value: creator ? `${creator.toString()} (\`${creator.username}\` | ${creator.id})` : '/' },
            { name: 'Created at', value: `<t:${Math.floor(createdTimestamp / 1000)}:f>` },
            {
              name: 'Start',
              value: scheduledStartTimestamp
                ? `<t:${Math.floor(scheduledStartTimestamp / 1000)}:f> (<t:${Math.floor(scheduledStartTimestamp / 1000)}:R>)`
                : '/',
            },
            {
              name: 'End',
              value: scheduledEndTimestamp ? `<t:${Math.floor(scheduledEndTimestamp / 1000)}:f> (<t:${Math.floor(scheduledEndTimestamp / 1000)}:R>)` : '/',
            }
          ),
      ],
    });
  },
});

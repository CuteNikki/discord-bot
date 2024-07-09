import { ChannelType, Colors, EmbedBuilder, Events, GuildScheduledEventPrivacyLevel, GuildScheduledEventStatus } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildScheduledEventCreate,
  once: false,
  async execute(client, event) {
    const { guild, name, status, creator, description, scheduledStartTimestamp, scheduledEndTimestamp, url, privacyLevel, channel, entityMetadata } = event;
    if (!guild) return;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.guildScheduledEventCreate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('Guild Scheduled Event Create')
          .setImage(event.coverImageURL({ size: 1024 }))
          .addFields(
            { name: 'Name', value: name },
            { name: 'Description', value: description || '/' },
            { name: 'URL', value: url },
            {
              name: 'Location',
              value: channel ? `${channel.toString()} (\`${channel.name}\` | ${channel.id})` : entityMetadata?.location ? `${entityMetadata?.location}` : '/',
            },
            { name: 'Creator', value: creator ? `${creator.toString()} (\`${creator.username}\` | ${creator.id})` : '/' },
            { name: 'Status', value: GuildScheduledEventStatus[status] },
            { name: 'Privacy Level', value: GuildScheduledEventPrivacyLevel[privacyLevel] },
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

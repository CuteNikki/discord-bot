import { ChannelType, Colors, EmbedBuilder, Events, GuildScheduledEventStatus } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildScheduledEventUpdate,
  once: false,
  async execute(client, oldEvent, newEvent) {
    const guild = newEvent.guild;
    if (!guild || !oldEvent || !newEvent) return;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.guildScheduledEventUpdate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle('Guild Scheduled Event Update')
      .setImage(newEvent.coverImageURL({ size: 1024 }))
      .addFields({ name: 'Event', value: `[${newEvent.name}](${newEvent.url})` });

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newEvent.name !== oldEvent.name)
      embed.addFields({ name: 'Old Name', value: oldEvent.name || '/', inline: true }, { name: 'New Name', value: newEvent.name, inline: true }, emptyField);
    if (newEvent.description !== oldEvent.description)
      embed.addFields(
        { name: 'Old Description', value: oldEvent.description || '/', inline: true },
        { name: 'New Description', value: newEvent.description || '/', inline: true },
        emptyField
      );
    if (newEvent.image !== oldEvent.image)
      embed.addFields(
        { name: 'Old Image', value: oldEvent.coverImageURL() || '/', inline: true },
        { name: 'New Image', value: newEvent.coverImageURL() || '/', inline: true },
        emptyField
      );
    if (newEvent.status !== oldEvent.status)
      embed.addFields(
        { name: 'Old Status', value: GuildScheduledEventStatus[oldEvent.status ?? 0] || '/', inline: true },
        { name: 'New Status', value: GuildScheduledEventStatus[newEvent.status] || '/', inline: true },
        emptyField
      );
    if (newEvent.scheduledEndTimestamp !== oldEvent.scheduledEndTimestamp)
      embed.addFields(
        {
          name: 'Old End',
          value: oldEvent.scheduledEndTimestamp
            ? `<t:${Math.floor(oldEvent.scheduledEndTimestamp / 1000)}:f> (<t:${Math.floor(oldEvent.scheduledEndTimestamp / 1000)}:R>)`
            : '/',
          inline: true,
        },
        {
          name: 'New End',
          value: newEvent.scheduledEndTimestamp
            ? `<t:${Math.floor(newEvent.scheduledEndTimestamp / 1000)}:f> (<t:${Math.floor(newEvent.scheduledEndTimestamp / 1000)}:R>)`
            : '/',
          inline: true,
        },
        emptyField
      );
    if (newEvent.scheduledStartTimestamp !== oldEvent.scheduledStartTimestamp)
      embed.addFields(
        {
          name: 'Old Start',
          value: oldEvent.scheduledStartTimestamp
            ? `<t:${Math.floor(oldEvent.scheduledStartTimestamp / 1000)}:f> (<t:${Math.floor(oldEvent.scheduledStartTimestamp / 1000)}:R>)`
            : '/',
          inline: true,
        },
        {
          name: 'New Start',
          value: newEvent.scheduledStartTimestamp
            ? `<t:${Math.floor(newEvent.scheduledStartTimestamp / 1000)}:f> (<t:${Math.floor(newEvent.scheduledStartTimestamp / 1000)}:R>)`
            : '/',
          inline: true,
        },
        emptyField
      );
    if (newEvent.channel !== oldEvent.channel || newEvent.entityMetadata?.location !== oldEvent.entityMetadata?.location)
      embed.addFields(
        {
          name: 'Old Location',
          value: oldEvent.channel
            ? `${oldEvent.channel.toString()} (\`${oldEvent.channel.name}\` | ${oldEvent.channel.id})`
            : oldEvent.entityMetadata?.location
            ? `${oldEvent.entityMetadata.location}`
            : '/',
          inline: true,
        },
        {
          name: 'New Location',
          value: newEvent.channel
            ? `${newEvent.channel.toString()} (\`${newEvent.channel.name}\` | ${newEvent.channel.id})`
            : newEvent.entityMetadata?.location
            ? `${newEvent.entityMetadata.location}`
            : '/',
          inline: true,
        },
        emptyField
      );

    await logChannel.send({ embeds: [embed] });
  },
});

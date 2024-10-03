import { Colors, EmbedBuilder, Events, GuildScheduledEventStatus } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildSettings } from 'db/guild';

export default new Event({
  name: Events.GuildScheduledEventUpdate,
  once: false,
  async execute(_client, oldEvent, newEvent) {
    const guild = newEvent.guild;
    if (!guild || !oldEvent || !newEvent) return;

    const config = await getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.guildScheduledEventUpdate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = config.language;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.guildScheduledEventUpdate.title', { lng }))
      .setImage(newEvent.coverImageURL({ size: 1024 }))
      .addFields({
        name: t('log.guildScheduledEventUpdate.event', { lng }),
        value: `[${newEvent.name}](${newEvent.url})`
      })
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newEvent.name !== oldEvent.name)
      embed.addFields(
        {
          name: t('log.guildScheduledEventUpdate.old-name', { lng }),
          value: oldEvent.name || '/',
          inline: true
        },
        {
          name: t('log.guildScheduledEventUpdate.new-name', { lng }),
          value: newEvent.name,
          inline: true
        },
        emptyField
      );
    if (newEvent.description !== oldEvent.description)
      embed.addFields(
        {
          name: t('log.guildScheduledEventUpdate.old-description', { lng }),
          value: oldEvent.description || '/',
          inline: true
        },
        {
          name: t('log.guildScheduledEventUpdate.new-description', { lng }),
          value: newEvent.description || '/',
          inline: true
        },
        emptyField
      );
    if (newEvent.image !== oldEvent.image)
      embed.addFields(
        {
          name: t('log.guildScheduledEventUpdate.old-image', { lng }),
          value: oldEvent.coverImageURL() || '/',
          inline: true
        },
        {
          name: t('log.guildScheduledEventUpdate.new-image', { lng }),
          value: newEvent.coverImageURL() || '/',
          inline: true
        },
        emptyField
      );
    if (newEvent.status !== oldEvent.status)
      embed.addFields(
        {
          name: t('log.guildScheduledEventUpdate.old-status', { lng }),
          value: GuildScheduledEventStatus[oldEvent.status ?? 0] || '/',
          inline: true
        },
        {
          name: t('log.guildScheduledEventUpdate.new-status', { lng }),
          value: GuildScheduledEventStatus[newEvent.status] || '/',
          inline: true
        },
        emptyField
      );
    if (newEvent.scheduledEndTimestamp !== oldEvent.scheduledEndTimestamp)
      embed.addFields(
        {
          name: t('log.guildScheduledEventUpdate.old-end', { lng }),
          value: oldEvent.scheduledEndTimestamp
            ? `<t:${Math.floor(oldEvent.scheduledEndTimestamp / 1000)}:f> (<t:${Math.floor(oldEvent.scheduledEndTimestamp / 1000)}:R>)`
            : '/',
          inline: true
        },
        {
          name: t('log.guildScheduledEventUpdate.new-end', { lng }),
          value: newEvent.scheduledEndTimestamp
            ? `<t:${Math.floor(newEvent.scheduledEndTimestamp / 1000)}:f> (<t:${Math.floor(newEvent.scheduledEndTimestamp / 1000)}:R>)`
            : '/',
          inline: true
        },
        emptyField
      );
    if (newEvent.scheduledStartTimestamp !== oldEvent.scheduledStartTimestamp)
      embed.addFields(
        {
          name: t('log.guildScheduledEventUpdate.old-start', { lng }),
          value: oldEvent.scheduledStartTimestamp
            ? `<t:${Math.floor(oldEvent.scheduledStartTimestamp / 1000)}:f> (<t:${Math.floor(oldEvent.scheduledStartTimestamp / 1000)}:R>)`
            : '/',
          inline: true
        },
        {
          name: t('log.guildScheduledEventUpdate.new-start', { lng }),
          value: newEvent.scheduledStartTimestamp
            ? `<t:${Math.floor(newEvent.scheduledStartTimestamp / 1000)}:f> (<t:${Math.floor(newEvent.scheduledStartTimestamp / 1000)}:R>)`
            : '/',
          inline: true
        },
        emptyField
      );
    if (newEvent.channel !== oldEvent.channel || newEvent.entityMetadata?.location !== oldEvent.entityMetadata?.location)
      embed.addFields(
        {
          name: t('log.guildScheduledEventUpdate.old-location', { lng }),
          value: oldEvent.channel
            ? `${oldEvent.channel.toString()} (\`${oldEvent.channel.name}\` | ${oldEvent.channel.id})`
            : oldEvent.entityMetadata?.location
              ? `${oldEvent.entityMetadata.location}`
              : '/',
          inline: true
        },
        {
          name: t('log.guildScheduledEventUpdate.new-location', { lng }),
          value: newEvent.channel
            ? `${newEvent.channel.toString()} (\`${newEvent.channel.name}\` | ${newEvent.channel.id})`
            : newEvent.entityMetadata?.location
              ? `${newEvent.entityMetadata.location}`
              : '/',
          inline: true
        },
        emptyField
      );

    await logChannel.send({ embeds: [embed] });
  }
});

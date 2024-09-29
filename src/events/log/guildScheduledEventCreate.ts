import { Colors, EmbedBuilder, Events, GuildScheduledEventPrivacyLevel, GuildScheduledEventStatus } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildSettings } from 'db/guild';

export default new Event({
  name: Events.GuildScheduledEventCreate,
  once: false,
  async execute(_client, event) {
    const { guild, name, status, creator, description, scheduledStartTimestamp, scheduledEndTimestamp, url, privacyLevel, channel, entityMetadata } = event;
    if (!guild) return;

    const config = await getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.guildScheduledEventCreate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle(t('log.guildScheduledEventCreate.title', { lng }))
          .setImage(event.coverImageURL({ size: 1024 }))
          .addFields(
            {
              name: t('log.guildScheduledEventCreate.name', { lng }),
              value: name
            },
            {
              name: t('log.guildScheduledEventCreate.description', { lng }),
              value: description || '/'
            },
            {
              name: t('log.guildScheduledEventCreate.url', { lng }),
              value: url
            },
            {
              name: t('log.guildScheduledEventCreate.location', { lng }),
              value: channel ? `${channel.toString()} (\`${channel.name}\` | ${channel.id})` : entityMetadata?.location ? `${entityMetadata?.location}` : '/'
            },
            {
              name: t('log.guildScheduledEventCreate.creator', { lng }),
              value: creator ? `${creator.toString()} (\`${creator.username}\` | ${creator.id})` : '/'
            },
            {
              name: t('log.guildScheduledEventCreate.status', { lng }),
              value: GuildScheduledEventStatus[status]
            },
            {
              name: t('log.guildScheduledEventCreate.privacy_level', { lng }),
              value: GuildScheduledEventPrivacyLevel[privacyLevel]
            },
            {
              name: t('log.guildScheduledEventCreate.start', { lng }),
              value: scheduledStartTimestamp ? `<t:${Math.floor(scheduledStartTimestamp / 1000)}:f> (<t:${Math.floor(scheduledStartTimestamp / 1000)}:R>)` : '/'
            },
            {
              name: t('log.guildScheduledEventCreate.end', { lng }),
              value: scheduledEndTimestamp ? `<t:${Math.floor(scheduledEndTimestamp / 1000)}:f> (<t:${Math.floor(scheduledEndTimestamp / 1000)}:R>)` : '/'
            }
          )
          .setTimestamp()
      ]
    });
  }
});

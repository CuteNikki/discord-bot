import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuild } from 'db/guild';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildScheduledEventDelete,
  once: false,
  async execute(_client, event) {
    const { guild, name, creator, description, scheduledStartTimestamp, scheduledEndTimestamp, url, createdTimestamp, channel, entityMetadata } = event;
    if (!guild) return;
    if (event.partial) await event.fetch().catch((err) => logger.debug({ err }, 'Could not fetch guild scheduled event'));

    const config = (await getGuild(guild.id)) ?? { log: { enabled: false } };

    if (!config.log.enabled || !config.log.events.guildScheduledEventDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = await getGuildLanguage(guild.id);

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle(t('log.guildScheduledEventDelete.title', { lng }))
          .setImage(event.coverImageURL({ size: 1024 }))
          .addFields(
            {
              name: t('log.guildScheduledEventDelete.name', { lng }),
              value: name || '/'
            },
            {
              name: t('log.guildScheduledEventDelete.description', { lng }),
              value: description || '/'
            },
            {
              name: t('log.guildScheduledEventDelete.url', { lng }),
              value: url
            },
            {
              name: t('log.guildScheduledEventDelete.location', { lng }),
              value: channel ? `${channel.toString()} (\`${channel.name}\` | ${channel.id})` : entityMetadata?.location ? `${entityMetadata?.location}` : '/'
            },
            {
              name: t('log.guildScheduledEventDelete.creator', { lng }),
              value: creator ? `${creator.toString()} (\`${creator.username}\` | ${creator.id})` : '/'
            },
            {
              name: t('log.guildScheduledEventDelete.created-at', { lng }),
              value: `<t:${Math.floor(createdTimestamp / 1000)}:f>`
            },
            {
              name: t('log.guildScheduledEventDelete.start', { lng }),
              value: scheduledStartTimestamp ? `<t:${Math.floor(scheduledStartTimestamp / 1000)}:f> (<t:${Math.floor(scheduledStartTimestamp / 1000)}:R>)` : '/'
            },
            {
              name: t('log.guildScheduledEventDelete.end', { lng }),
              value: scheduledEndTimestamp ? `<t:${Math.floor(scheduledEndTimestamp / 1000)}:f> (<t:${Math.floor(scheduledEndTimestamp / 1000)}:R>)` : '/'
            }
          )
          .setTimestamp()
      ]
    });
  }
});

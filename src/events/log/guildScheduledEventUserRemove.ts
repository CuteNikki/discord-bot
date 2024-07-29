import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildScheduledEventUserRemove,
  once: false,
  async execute(client, event, user) {
    if (event.partial) await event.fetch().catch((error) => logger.debug({ error }, 'Could not fetch guild scheduled event'));
    const guild = event.guild;
    if (!guild) return;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.guildScheduledEventUserRemove || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle(t('log.guildScheduledEventUserRemove.title', { lng }))
          .setImage(event.coverImageURL({ size: 1024 }))
          .addFields(
            {
              name: t('log.guildScheduledEventUserRemove.event', { lng }),
              value: `[${event.name}](${event.url})`,
            },
            {
              name: t('log.guildScheduledEventUserRemove.user', { lng }),
              value: `${user.toString()} (\`${user.username}\` | ${user.id})`,
            },
          )
          .setTimestamp(),
      ],
    });
  },
});

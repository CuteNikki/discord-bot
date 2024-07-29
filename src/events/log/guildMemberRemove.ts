import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildMemberRemove,
  once: false,
  async execute(client, member) {
    const { guild, user, partial, joinedTimestamp } = member;
    if (partial) await member.fetch().catch((error) => logger.debug({ error }, 'Could not fetch member'));

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.guildMemberRemove || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle(t('log.guildMemberRemove.title', { lng }))
          .addFields(
            {
              name: t('log.guildMemberRemove.member', { lng }),
              value: `${user.toString()} (\`${user.username}\` | ${user.id})`,
            },
            {
              name: t('log.guildMemberRemove.created_at', { lng }),
              value: `<t:${Math.floor(user.createdTimestamp / 1000)}:f> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`,
            },
            {
              name: t('log.guildMemberRemove.joined_at', { lng }),
              value: `<t:${Math.floor((joinedTimestamp || 0) / 1000)}:f> (<t:${Math.floor((joinedTimestamp || 0) / 1000)}:R>)`,
            },
          )
          .setTimestamp(),
      ],
    });
  },
});

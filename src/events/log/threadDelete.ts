import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.ThreadDelete,
  once: false,
  async execute(client, thread) {
    const { guild, name, id, appliedTags, createdTimestamp, archiveTimestamp, locked, ownerId } = thread;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.threadDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const owner = await thread.fetchOwner().catch((error) => logger.debug({ error }, 'Could not fetch thread owner'));

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle(t('log.threadDelete.title', { lng }))
          .addFields(
            { name: t('log.threadDelete.thread', { lng }), value: `\`${name}\` (${id})` },
            { name: t('log.threadDelete.owner', { lng }), value: owner ? `<@${ownerId}> (\`${owner.user?.username}\` | ${ownerId})` : '/' },
            { name: t('log.threadDelete.locked', { lng }), value: `${locked}` },
            { name: t('log.threadDelete.applied_tags', { lng }), value: appliedTags.join('\n').slice(0, 1000) || '/' },
            { name: t('log.threadDelete.archived_at', { lng }), value: archiveTimestamp ? `<t:${Math.floor(archiveTimestamp / 1000)}:f>` : '/' },
            { name: t('log.threadDelete.created_at', { lng }), value: createdTimestamp ? `<t:${Math.floor(createdTimestamp / 1000)}:f>` : '/' }
          )
          .setTimestamp(),
      ],
    });
  },
});

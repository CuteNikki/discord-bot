import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuild } from 'db/guild';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.ThreadDelete,
  once: false,
  async execute(_client, thread) {
    const { guild, name, id, appliedTags, createdTimestamp, archiveTimestamp, locked, ownerId } = thread;

    const config = await getGuild(guild.id);

    if (!config.log.enabled || !config.log.events.threadDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const owner = await thread.fetchOwner().catch((err) => logger.debug({ err }, 'Could not fetch thread owner'));

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle(t('log.threadDelete.title', { lng }))
          .addFields(
            {
              name: t('log.threadDelete.thread', { lng }),
              value: `\`${name}\` (${id})`
            },
            {
              name: t('log.threadDelete.owner', { lng }),
              value: owner ? `<@${ownerId}> (\`${owner.user?.username}\` | ${ownerId})` : '/'
            },
            { name: t('log.threadDelete.locked', { lng }), value: `${locked}` },
            {
              name: t('log.threadDelete.applied-tags', { lng }),
              value: appliedTags.join('\n').slice(0, 1000) || '/'
            },
            {
              name: t('log.threadDelete.archived-at', { lng }),
              value: archiveTimestamp ? `<t:${Math.floor(archiveTimestamp / 1000)}:f>` : '/'
            },
            {
              name: t('log.threadDelete.created-at', { lng }),
              value: createdTimestamp ? `<t:${Math.floor(createdTimestamp / 1000)}:f>` : '/'
            }
          )
          .setTimestamp()
      ]
    });
  }
});

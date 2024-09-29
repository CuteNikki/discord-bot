import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildSettings } from 'db/guild';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.ThreadCreate,
  once: false,
  async execute(_client, thread) {
    const { guild, name, id, appliedTags, ownerId } = thread;

    const config = await getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.threadCreate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const owner = await thread.fetchOwner().catch((err) => logger.debug({ err }, 'Could not fetch thread owner'));

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle(t('log.threadCreate.title', { lng }))
          .addFields(
            {
              name: t('log.threadCreate.thread', { lng }),
              value: `${thread.toString()} (\`${name}\` | ${id})`
            },
            {
              name: t('log.threadCreate.owner', { lng }),
              value: owner ? `<@${owner.id}> (\`${owner.user?.username}\` | ${ownerId})` : '/'
            },
            {
              name: t('log.threadCreate.applied_tags', { lng }),
              value: appliedTags.join('\n').slice(0, 1000) || '/'
            }
          )
          .setTimestamp()
      ]
    });
  }
});

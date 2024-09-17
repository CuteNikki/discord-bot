import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildSettings } from 'db/guild';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageDelete,
  once: false,
  async execute(_client, message) {
    const guild = message.guild;
    if (!guild || !message.author || message.author.bot) return;
    if (message.partial) await message.fetch().catch((err) => logger.debug({ err }, 'Could not fetch message'));

    const config = await getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.messageDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle(t('log.messageDelete.title', { lng }))
          .setDescription(
            `${t('log.messageDelete.content', { lng })}: ${message.content ? (message.content.length > 3800 ? message.content.slice(0, 3800) + '...' : message.content) : '/'}`,
          )
          .addFields(
            {
              name: t('log.messageDelete.author', { lng }),
              value: `${message.author.toString()} (\`${message.author.username}\` | ${message.author.id})`,
            },
            {
              name: t('log.messageDelete.reactions', { lng }),
              value:
                message.reactions.cache
                  .map((reaction) => `${reaction.count}x ${reaction.emoji}`)
                  .join('\n')
                  .slice(0, 1000) || '/',
            },
            {
              name: t('log.messageDelete.attachments', { lng }),
              value:
                message.attachments
                  .map((attachment) => attachment.url)
                  .join('\n')
                  .slice(0, 1000) || '/',
            },
          )
          .setTimestamp(),
      ],
      files: message.attachments.map((a) => a),
    });
  },
});

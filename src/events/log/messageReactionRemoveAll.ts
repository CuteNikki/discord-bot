import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageReactionRemoveAll,
  once: false,
  async execute(client, message, reactions) {
    const guild = message.guild;
    if (!guild || !message.author || message.author.bot) return;
    if (message.partial) await message.fetch().catch((err) => logger.debug({ err }, 'Could not fetch message'));

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.messageReactionRemoveAll || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!config.log.enabled || !logChannel || logChannel.type !== ChannelType.GuildText) return;

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle(t('log.messageReactionRemoveAll.title', { lng }))
          .addFields(
            {
              name: t('log.messageReactionRemoveAll.author', { lng }),
              value: `${message.author.toString()} (\`${message.author.username}\` | ${message.author.id})`,
            },
            {
              name: t('log.messageReactionRemoveAll.message', { lng }),
              value: message.url,
            },
            {
              name: t('log.messageReactionRemoveAll.reactions', { lng }),
              value:
                reactions
                  .map((reaction) => `${reaction.count}x ${reaction.emoji}`)
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

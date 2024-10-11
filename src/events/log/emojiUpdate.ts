import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuild } from 'db/guild';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildEmojiUpdate,
  once: false,
  async execute(_client, oldEmoji, newEmoji) {
    const guild = newEmoji.guild;

    const config = await getGuild(guild.id);

    if (!config.log.enabled || !config.log.events.emojiUpdate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const author = await newEmoji.fetchAuthor().catch((err) => logger.debug({ err }, 'Could not fetch emoji author'));

    const lng = config.language;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.emojiUpdate.title', { lng }))
      .setThumbnail(newEmoji.imageURL({ size: 1024 }))
      .addFields(
        {
          name: t('log.emojiUpdate.emoji', { lng }),
          value: `${newEmoji.toString()} (\`${newEmoji.name}\` | ${newEmoji.id})`
        },
        {
          name: t('log.emojiUpdate.author', { lng }),
          value: author ? `${author.toString()} (\`${author.username}\` | ${author.id})` : '/'
        }
      )
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newEmoji.name !== oldEmoji.name)
      embed.addFields(
        {
          name: t('log.emojiUpdate.old-name', { lng }),
          value: `${oldEmoji.name}`,
          inline: true
        },
        {
          name: t('log.emojiUpdate.new-name', { lng }),
          value: `${newEmoji.name}`,
          inline: true
        },
        emptyField
      );
    if (JSON.stringify(newEmoji.roles.cache.toJSON()) !== JSON.stringify(oldEmoji.roles.cache.toJSON())) {
      embed.addFields(
        {
          name: t('log.emojiUpdate.old-roles', { lng }),
          value:
            oldEmoji.roles.cache
              .map((role) => role.toString())
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true
        },
        {
          name: t('log.emojiUpdate.new-roles', { lng }),
          value:
            newEmoji.roles.cache
              .map((role) => role.toString())
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true
        },
        emptyField
      );
    }

    await logChannel.send({
      embeds: [embed]
    });
  }
});

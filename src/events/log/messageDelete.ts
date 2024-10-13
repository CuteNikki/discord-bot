import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { GuildLogEvent } from 'types/guild-log';

export default new Event({
  name: Events.MessageDelete,
  once: false,
  async execute(_client, message) {
    const guild = message.guild;

    if (!guild || !message.author || message.author.bot) {
      return;
    }

    if (message.partial) {
      await message.fetch().catch((err) => logger.debug({ err }, 'GuildLog | MessageDelete: Could not fetch message'));
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as GuildLogEvent[] };

    const event = log.events.find((e) => e.name === Events.MessageDelete) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | MessageDelete: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    const embed = new EmbedBuilder()
      .setColor(Colors.Red)
      .setTitle(t('log.messageDelete.title', { lng }))
      .setDescription(
        `${t('log.messageDelete.content', { lng })}: ${message.content ? (message.content.length > 3800 ? message.content.slice(0, 3800) + '...' : message.content) : '/'}`
      )
      .addFields(
        {
          name: t('log.messageDelete.author', { lng }),
          value: `${message.author.toString()} (\`${message.author.username}\` | ${message.author.id})`
        },
        {
          name: t('log.messageDelete.channel', { lng }),
          value: `${message.channel.toString()} | ${message.channel.id}`
        }
      )
      .setTimestamp();

    if (message.reactions.cache.size) {
      embed.addFields({
        name: t('log.messageDelete.reactions', { lng }),
        value: message.reactions.cache
          .map((reaction) => `${reaction.count}x ${reaction.emoji}`)
          .join('\n')
          .slice(0, 1000)
      });
    }

    if (message.attachments.size) {
      embed.addFields({
        name: t('log.messageDelete.attachments', { lng }),
        value: message.attachments
          .map((attachment) => attachment.url)
          .join('\n')
          .slice(0, 1000)
      });
    }

    await logChannel
      .send({
        embeds: [embed],
        files: message.attachments.map((a) => a)
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | MessageDelete: Could not send message'));
  }
});

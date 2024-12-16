import { AttachmentBuilder, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { GuildLogEvent } from 'types/guild-log';

export default new Event({
  name: Events.MessageBulkDelete,
  once: false,
  async execute(_client, messages) {
    const firstMessage = messages.first();

    if (!firstMessage) {
      return;
    }

    const guild = firstMessage.guild;

    if (!guild) {
      return;
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as GuildLogEvent[] };

    const event = log.events.find((e) => e.name === Events.MessageBulkDelete) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels
      .fetch(event.channelId)
      .catch((err) => logger.debug({ err }, 'GuildLog | MessageDeleteBulk: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle(t('log.messageDeleteBulk.title', { lng }))
            .setDescription(
              t('log.messageDeleteBulk.description', {
                lng,
                messages: messages.size,
                channel: messages.first()?.channel.toString()
              })
            )
            .setTimestamp()
        ],
        files: [
          new AttachmentBuilder(
            Buffer.from(
              `${messages
                .map(
                  (message) =>
                    `${t('log.messageDeleteBulk.author', { lng })}: ${message.author?.username} (${message.author?.id})\n${t(
                      'log.messageDeleteBulk.attachments',
                      {
                        lng
                      }
                    )}: ${message.attachments.map((attachment) => attachment.url).join('\n          ')}\n${t('log.messageDeleteBulk.content', { lng })}: ${message.content}`
                )
                .join('\n\n')}`
            ),
            {
              name: 'message-bulk-delete.txt',
              description: t('log.messageDeleteBulk.file-description', { lng })
            }
          )
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | MessageDeleteBulk: Could not send message'));
  }
});

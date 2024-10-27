import { AttachmentBuilder, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { GuildLogEvent } from 'types/guild-log';

export default new Event({
  name: Events.MessageUpdate,
  once: false,
  async execute(_client, oldMessage, newMessage) {
    const guild = newMessage.guild;

    if (
      !guild ||
      !newMessage.author ||
      newMessage.author.bot ||
      (oldMessage.content === newMessage.content && oldMessage.attachments.size === newMessage.attachments.size && oldMessage.pinned === newMessage.pinned)
    ) {
      return;
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as GuildLogEvent[] };

    const event = log.events.find((e) => e.name === Events.MessageUpdate) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | MessageUpdate: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.messageUpdate.title', { lng }))
      .addFields(
        {
          name: t('log.messageUpdate.author', { lng }),
          value: `${newMessage.author.toString()} (\`${newMessage.author.username}\` | ${newMessage.author.id})`
        },
        {
          name: t('log.messageDelete.channel', { lng }),
          value: `${newMessage.channel.toString()} | ${newMessage.channel.id}`
        }
      )
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newMessage.content !== oldMessage.content) {
      embed.addFields(
        {
          name: t('log.messageUpdate.old-content', { lng }),
          value: oldMessage.content ? (oldMessage.content.length > 950 ? oldMessage.content.slice(0, 950) + '...' : oldMessage.content) : '/',
          inline: true
        },
        {
          name: t('log.messageUpdate.new-content', { lng }),
          value: newMessage.content ? (newMessage.content.length > 950 ? newMessage.content.slice(0, 950) + '...' : newMessage.content) : '/',
          inline: true
        },
        emptyField
      );
    }

    if ((newMessage.pinned ?? false) !== (oldMessage.pinned ?? false)) {
      embed.addFields(
        {
          name: t('log.messageUpdate.old-pinned', { lng }),
          value: `${oldMessage.pinned ?? false}`,
          inline: true
        },
        {
          name: t('log.messageUpdate.new-pinned', { lng }),
          value: `${newMessage.pinned ?? false}`,
          inline: true
        },
        emptyField
      );
    }

    if ((newMessage.attachments.size ?? 0) !== (oldMessage.attachments.size ?? 0)) {
      const oldAttachments = oldMessage.attachments.map((a) => a);
      const newAttachments = newMessage.attachments.map((a) => a);

      embed.addFields({
        name: t('log.messageUpdate.deleted-attachments', { lng }),
        value:
          oldAttachments
            .filter((attachment) => newAttachments.map((att) => att.id).includes(attachment.id))
            .map((attachment) => attachment.url)
            .join('\n')
            .slice(0, 1000) ?? t('none', { lng })
      });
    }

    const embedData = embed.toJSON();

    if (!embedData.fields?.length || embedData.fields.length > 25) {
      return;
    }

    await logChannel
      .send({
        embeds: [embed],
        files:
          (oldMessage.content?.length ?? 0) > 950 || (newMessage.content?.length ?? 0) > 950
            ? [
                new AttachmentBuilder(Buffer.from(oldMessage.content ?? ''), {
                  name: 'old-msg-content.txt'
                }),
                new AttachmentBuilder(Buffer.from(oldMessage.content ?? ''), {
                  name: 'new-msg-content.txt'
                })
              ]
            : []
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | MessageUpdate: Could not send message'));
  }
});

import { AttachmentBuilder, ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

export default new Event({
  name: Events.MessageBulkDelete,
  once: false,
  async execute(client, messages) {
    const firstMessage = messages.first();
    if (!firstMessage) return;

    const guild = firstMessage.guild;
    if (!guild) return;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.messageBulkDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle(t('log.messageBulkDelete.title', { lng }))
          .setDescription(
            t('log.messageBulkDelete.description', {
              lng,
              messages: messages.size,
              channel: messages.first()?.channel.toString(),
            }),
          )
          .setTimestamp(),
      ],
      files: [
        new AttachmentBuilder(
          Buffer.from(
            `${messages
              .map(
                (message) =>
                  `${t('log.messageBulkDelete.author', { lng })}: ${message.author?.username} (${message.author?.id})\n${t(
                    'log.messageBulkDelete.attachments',
                    {
                      lng,
                    },
                  )}: ${message.attachments.map((attachment) => attachment.url).join('\n          ')}\n${t('log.messageBulkDelete.content', { lng })}: ${message.content}`,
              )
              .join('\n\n')}`,
          ),
          {
            name: 'message-bulk-delete.txt',
            description: t('log.messageBulkDelete.file_description', { lng }),
          },
        ),
      ],
    });
  },
});

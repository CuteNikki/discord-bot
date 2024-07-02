import { AttachmentBuilder, ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

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

    if (!config.log.events.messageBulkDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    await logChannel.send({
      embeds: [new EmbedBuilder().setColor(Colors.Red).setTitle('Message Bulk Delete').setDescription(`${messages.size} deleted messages`)],
      files: [
        new AttachmentBuilder(
          Buffer.from(
            `${messages
              .map(
                (message) =>
                  `Author: ${message.author?.username} (${message.author?.id})\nAttachments: ${message.attachments
                    .map((attachment) => attachment.url)
                    .join('\n          ')}\nContent: ${message.content}`
              )
              .join('\n\n')}`
          ),
          { name: 'message-bulk-delete.txt', description: 'List of all deleted messages with their author, content and attachments' }
        ),
      ],
    });
  },
});

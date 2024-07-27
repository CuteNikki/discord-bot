import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.MessageDelete,
  once: false,
  async execute(client, message) {
    const guild = message.guild;
    if (!guild || !message.author || message.author.bot) return;
    if (message.partial) await message.fetch().catch((error) => logger.debug({ error }, 'Could not fetch message'));

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.messageDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!config.log.enabled || !logChannel || logChannel.type !== ChannelType.GuildText) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('Message Delete')
          .addFields(
            {
              name: 'Author',
              value: `${message.author.toString()} (\`${message.author.username}\` | ${message.author.id})`,
            },
            { name: 'Content', value: message.content?.slice(0, 1000) || '/' },
            {
              name: 'Reactions',
              value:
                message.reactions.cache
                  .map((reaction) => `${reaction.count}x ${reaction.emoji}`)
                  .join('\n')
                  .slice(0, 1000) || '/',
            },
            {
              name: 'Attachments',
              value:
                message.attachments
                  .map((attachment) => attachment.url)
                  .join('\n')
                  .slice(0, 1000) || '/',
            }
          ),
      ],
      files: message.attachments.map((a) => a),
    });
  },
});

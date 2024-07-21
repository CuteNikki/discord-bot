import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.MessageReactionRemoveAll,
  once: false,
  async execute(client, message, reactions) {
    const guild = message.guild;
    if (!guild || !message.author || message.author.bot) return;
    if (message.partial) await message.fetch().catch(() => {});

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.messageReactionRemoveAll || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!config.log.enabled || !logChannel || logChannel.type !== ChannelType.GuildText) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle('Message Reaction Remove All')
          .addFields(
            {
              name: 'Author',
              value: `${message.author.toString()} (\`${message.author.username}\` | ${message.author.id})`,
            },
            {
              name: 'Message',
              value: message.url,
            },
            {
              name: 'Reactions',
              value:
                reactions
                  .map((reaction) => `${reaction.count}x ${reaction.emoji}`)
                  .join('\n')
                  .slice(0, 1000) || '/',
            }
          ),
      ],
      files: message.attachments.map((a) => a),
    });
  },
});

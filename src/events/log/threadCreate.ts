import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.ThreadCreate,
  once: false,
  async execute(client, thread) {
    const { guild, name, id, appliedTags, ownerId } = thread;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.threadCreate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const owner = await thread.fetchOwner().catch((error) => logger.debug({ error }, 'Could not fetch thread owner'));

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('Thread Create')
          .addFields(
            { name: 'Thread', value: `${thread.toString()} (\`${name}\` | ${id})` },
            { name: 'Owner', value: owner ? `<@${owner.id}> (\`${owner.user?.username}\` | ${ownerId})` : '/' },
            { name: 'Applied Tags', value: appliedTags.join('\n').slice(0, 1000) || '/' }
          ),
      ],
    });
  },
});

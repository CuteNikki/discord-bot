import { ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.ThreadDelete,
  once: false,
  async execute(client, thread) {
    const { guild, name, id, appliedTags, createdTimestamp, archiveTimestamp, locked, ownerId } = thread;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.threadDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const owner = await thread.fetchOwner().catch((error) => logger.debug({ error }, 'Could not fetch thread owner'));

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('Thread Delete')
          .addFields(
            { name: 'Thread', value: `\`${name}\` (${id})` },
            { name: 'Owner', value: owner ? `<@${ownerId}> (\`${owner.user?.username}\` | ${ownerId})` : '/' },
            { name: 'Locked', value: `${locked}` },
            { name: 'Applied Tags', value: appliedTags.join('\n').slice(0, 1000) || '/' },
            { name: 'Archived at', value: archiveTimestamp ? `<t:${Math.floor(archiveTimestamp / 1000)}:f>` : '/' },
            { name: 'Created at', value: createdTimestamp ? `<t:${Math.floor(createdTimestamp / 1000)}:f>` : '/' }
          ),
      ],
    });
  },
});

import { ChannelType, Colors, EmbedBuilder, Events, InviteGuild } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

export default new Event({
  name: Events.InviteDelete,
  once: false,
  async execute(client, invite) {
    const { guild, channel, url } = invite;
    if (!guild || guild instanceof InviteGuild) return;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.inviteDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle(t('log.inviteDelete.title', { lng }))
          .addFields(
            { name: t('log.inviteDelete.url', { lng }), value: url },
            { name: t('log.inviteDelete.channel', { lng }), value: channel ? `${channel.toString()} (\`${channel.name}\` | ${channel.id})` : '/' }
          )
          .setTimestamp(),
      ],
    });
  },
});

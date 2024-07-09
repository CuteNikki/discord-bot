import { ChannelType, Colors, EmbedBuilder, Events, InviteGuild } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.InviteCreate,
  once: false,
  async execute(client, invite) {
    const { guild, inviter, channel, url, expiresTimestamp, temporary, maxUses } = invite;
    if (!guild || guild instanceof InviteGuild) return;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.inviteCreate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('Invite Create')
          .addFields(
            { name: 'URL', value: url },
            { name: 'Expires at', value: expiresTimestamp ? `<t:${Math.floor(expiresTimestamp / 1000)}:f>` : 'never' },
            { name: 'Max Uses', value: `${maxUses || '/'}` },
            { name: 'Temporary Membership', value: `${temporary ?? '/'}` },
            { name: 'Channel', value: channel ? `${channel.toString()} (\`${channel.name}\` | ${channel.id})` : '/' },
            { name: 'Created by', value: inviter ? `${inviter.toString()} (\`${inviter.username}\` | ${inviter.id})` : '/' }
          ),
      ],
    });
  },
});

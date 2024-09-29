import { Colors, EmbedBuilder, Events, InviteGuild } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildSettings } from 'db/guild';

export default new Event({
  name: Events.InviteCreate,
  once: false,
  async execute(_client, invite) {
    const { guild, inviter, channel, url, expiresTimestamp, temporary, maxUses } = invite;
    if (!guild || guild instanceof InviteGuild) return;

    const config = await getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.inviteCreate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle(t('log.inviteCreate.title', { lng }))
          .addFields(
            { name: t('log.inviteCreate.url', { lng }), value: url },
            {
              name: t('log.inviteCreate.expires_at', { lng }),
              value: expiresTimestamp ? `<t:${Math.floor(expiresTimestamp / 1000)}:f>` : 'never'
            },
            {
              name: t('log.inviteCreate.max_uses', { lng }),
              value: `${maxUses || '/'}`
            },
            {
              name: t('log.inviteCreate.temporary_membership', { lng }),
              value: `${temporary ?? '/'}`
            },
            {
              name: t('log.inviteCreate.channel', { lng }),
              value: channel ? `${channel.toString()} (\`${channel.name}\` | ${channel.id})` : '/'
            },
            {
              name: t('log.inviteCreate.created_by', { lng }),
              value: inviter ? `${inviter.toString()} (\`${inviter.username}\` | ${inviter.id})` : '/'
            }
          )
          .setTimestamp()
      ]
    });
  }
});

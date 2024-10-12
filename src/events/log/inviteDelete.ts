import { Colors, EmbedBuilder, Events, InviteGuild } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuild } from 'db/guild';
import { getGuildLanguage } from 'db/language';

export default new Event({
  name: Events.InviteDelete,
  once: false,
  async execute(_client, invite) {
    const { guild, channel, url } = invite;
    if (!guild || guild instanceof InviteGuild) return;

    const config = (await getGuild(guild.id)) ?? { log: { enabled: false } };

    if (!config.log.enabled || !config.log.events.inviteDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = await getGuildLanguage(guild.id);

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle(t('log.inviteDelete.title', { lng }))
          .addFields(
            { name: t('log.inviteDelete.url', { lng }), value: url },
            {
              name: t('log.inviteDelete.channel', { lng }),
              value: channel ? `${channel.toString()} (\`${channel.name}\` | ${channel.id})` : '/'
            }
          )
          .setTimestamp()
      ]
    });
  }
});

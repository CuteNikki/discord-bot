import { Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuild } from 'db/guild';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.GuildBanAdd,
  once: false,
  async execute(_client, ban) {
    const { guild, user, reason, partial } = ban;
    if (partial) await ban.fetch().catch((err) => logger.debug({ err }, 'Could not fetch ban'));

    const config = (await getGuild(guild.id)) ?? { log: { enabled: false } };

    if (!config.log.enabled || !config.log.events.guildBanAdd || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = await getGuildLanguage(guild.id);

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle(t('log.guildBanAdd.title', { lng }))
          .addFields(
            {
              name: t('log.guildBanAdd.user', { lng }),
              value: `${user.toString()} (\`${user.username}\` | ${user.id})`
            },
            {
              name: t('log.guildBanAdd.reason', { lng }),
              value: reason || '/'
            }
          )
          .setTimestamp()
      ]
    });
  }
});

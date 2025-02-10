import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { LoggedEvent } from 'types/guild-log';

export default new Event({
  name: Events.GuildMemberAdd,
  once: false,
  async execute(_client, member) {
    const { guild, user, partial } = member;

    if (partial) {
      await member.fetch().catch((err) => logger.debug({ err }, 'GuildLog | GuildMemberAdd: Could not fetch member'));
    }

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as LoggedEvent[] };

    const event = log.events.find((e) => e.name === Events.GuildMemberAdd) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels.fetch(event.channelId).catch((err) => logger.debug({ err }, 'GuildLog | GuildMemberAdd: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    const lng = await getGuildLanguage(guild.id);

    const embed = new EmbedBuilder()
      .setColor(Colors.Green)
      .setTitle(t('log.guildMemberAdd.title', { lng }))
      .addFields(
        {
          name: t('log.guildMemberAdd.member', { lng }),
          value: `${user.toString()} (\`${user.username}\` | ${user.id})`
        },
        {
          name: t('log.guildMemberAdd.created-at', { lng }),
          value: `<t:${Math.floor(user.createdTimestamp / 1000)}:f> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`
        }
      )
      .setTimestamp();

    if (Date.now() - user.createdTimestamp < 7 * 24 * 60 * 60 * 1000) {
      embed.addFields({
        name: t('log.guildMemberAdd.potentially-dangerous', { lng }),
        value: t('log.guildMemberAdd.young-account', { lng })
      });
      components.push(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(`button-ban_${user.id}`).setStyle(ButtonStyle.Danger).setLabel(t('log.guildMemberAdd.ban', { lng })),
          new ButtonBuilder().setCustomId(`button-kick_${user.id}`).setStyle(ButtonStyle.Danger).setLabel(t('log.guildMemberAdd.kick', { lng }))
        )
      );
    }

    await logChannel
      .send({
        embeds: [embed],
        components
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | GuildMemberAdd: Could not send message'));
  }
});

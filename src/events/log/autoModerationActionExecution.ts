import { AutoModerationActionType, AutoModerationRuleTriggerType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { LoggedEvent } from 'types/guild-log';

export default new Event({
  name: Events.AutoModerationActionExecution,
  once: false,
  async execute(_client, autoModerationActionExecution) {
    const { guild, action, ruleTriggerType, userId, channelId, matchedContent } = autoModerationActionExecution;

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as LoggedEvent[] };

    const event = log.events.find((e) => e.name === Events.AutoModerationActionExecution) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId) {
      return;
    }

    const logChannel = await guild.channels
      .fetch(event.channelId)
      .catch((err) => logger.debug({ err }, 'GuildLog | AutoModerationActionExecution: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    await logChannel
      .send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Orange)
            .setTitle(t('log.autoModerationActionExecution.title', { lng }))
            .addFields(
              {
                name: t('log.autoModerationActionExecution.action-type', { lng }),
                value: AutoModerationActionType[action.type]
              },
              {
                name: t('log.autoModerationActionExecution.rule-trigger-type', {
                  lng
                }),
                value: AutoModerationRuleTriggerType[ruleTriggerType]
              },
              {
                name: t('log.autoModerationActionExecution.user', { lng }),
                value: `<@${userId}>`
              },
              {
                name: t('log.autoModerationActionExecution.channel', { lng }),
                value: `<@${channelId}>`
              },
              {
                name: t('log.autoModerationActionExecution.matched-content', {
                  lng
                }),
                value: matchedContent || '/'
              }
            )
            .setTimestamp()
        ]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | AutoModerationActionExecution: Could not send message'));
  }
});

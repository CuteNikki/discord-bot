import { AutoModerationActionType, AutoModerationRuleTriggerType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildSettings } from 'db/guild';

export default new Event({
  name: Events.AutoModerationActionExecution,
  once: false,
  async execute(_client, autoModerationActionExecution) {
    const { guild, action, ruleTriggerType, userId, channelId, matchedContent } = autoModerationActionExecution;

    const config = await getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.autoModerationActionExecution || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = config.language;

    await logChannel.send({
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
    });
  }
});

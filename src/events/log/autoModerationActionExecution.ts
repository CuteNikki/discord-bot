import { AutoModerationActionType, AutoModerationRuleTriggerType, ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

export default new Event({
  name: Events.AutoModerationActionExecution,
  once: false,
  async execute(client, autoModerationActionExecution) {
    const { guild, action, ruleTriggerType, userId, channelId, matchedContent } = autoModerationActionExecution;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.autoModerationActionExecution || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle(t('log.autoModerationActionExecution.title', { lng }))
          .addFields(
            {
              name: t('log.autoModerationActionExecution.action_type', { lng }),
              value: AutoModerationActionType[action.type],
            },
            {
              name: t('log.autoModerationActionExecution.rule_trigger_type', {
                lng,
              }),
              value: AutoModerationRuleTriggerType[ruleTriggerType],
            },
            {
              name: t('log.autoModerationActionExecution.user', { lng }),
              value: `<@${userId}>`,
            },
            {
              name: t('log.autoModerationActionExecution.channel', { lng }),
              value: `<@${channelId}>`,
            },
            {
              name: t('log.autoModerationActionExecution.matched_content', {
                lng,
              }),
              value: matchedContent || '/',
            },
          )
          .setTimestamp(),
      ],
    });
  },
});

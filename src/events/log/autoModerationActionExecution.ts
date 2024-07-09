import { AutoModerationActionType, AutoModerationRuleTriggerType, ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

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

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle('Auto Moderation Action Execution')
          .addFields(
            { name: 'Action Type', value: AutoModerationActionType[action.type] },
            { name: 'Rule Trigger Type', value: AutoModerationRuleTriggerType[ruleTriggerType] },
            { name: 'User', value: `<@${userId}>` },
            { name: 'Channel', value: `<@${channelId}>` },
            { name: 'Matched Content', value: matchedContent || '/' }
          ),
      ],
    });
  },
});

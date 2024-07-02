import { AutoModerationActionType, AutoModerationRuleTriggerType, ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.AutoModerationRuleCreate,
  once: false,
  async execute(client, autoModerationRule) {
    const { guild, creatorId, triggerType, triggerMetadata, name, exemptRoles, exemptChannels, actions } = autoModerationRule;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.events.autoModerationRuleCreate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('Auto Moderation Rule Create')
          .addFields(
            { name: 'Created by', value: `<@${creatorId}>` },
            { name: 'Rule Name', value: name },
            { name: 'Rule Trigger Type', value: AutoModerationRuleTriggerType[triggerType] },
            {
              name: 'Trigger Metadata',
              value: [
                `Keyword Filter: ${
                  triggerMetadata.keywordFilter
                    .map((word) => `\`${word}\``)
                    .join(', ')
                    .slice(0, 200) || '/'
                }`,
                `Regex Patterns: ${
                  triggerMetadata.regexPatterns
                    .map((pattern) => `\`${pattern}\``)
                    .join(', ')
                    .slice(0, 200) || '/'
                }`,
                `Mention Total Limit: ${triggerMetadata.mentionTotalLimit || '/'}`,
                `Mention Raid Protection: ${triggerMetadata.mentionRaidProtectionEnabled}`,
              ].join('\n'),
            },
            {
              name: 'Actions',
              value:
                actions
                  .map((action) => `${AutoModerationActionType[action.type]}`)
                  .join('\n')
                  .slice(0, 1000) || '/',
            },
            {
              name: 'Exempt Roles',
              value:
                exemptRoles
                  .map((role) => `<@&${role.id}>`)
                  .join(', ')
                  .slice(0, 1000) || '/',
            },
            {
              name: 'Exempt Channels',
              value:
                exemptChannels
                  .map((channel) => `<#${channel.id}>`)
                  .join(', ')
                  .slice(0, 1000) || '/',
            }
          ),
      ],
    });
  },
});

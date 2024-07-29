import { AutoModerationActionType, AutoModerationRuleTriggerType, ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

export default new Event({
  name: Events.AutoModerationRuleDelete,
  once: false,
  async execute(client, autoModerationRule) {
    const { guild, creatorId, triggerType, triggerMetadata, name, exemptRoles, exemptChannels, actions } = autoModerationRule;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.autoModerationRuleDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle(t('log.autoModerationRuleDelete.title', { lng }))
          .addFields(
            { name: t('log.autoModerationRuleDelete.created_by', { lng }), value: `<@${creatorId}>` },
            { name: t('log.autoModerationRuleDelete.rule_name', { lng }), value: name },
            { name: t('log.autoModerationRuleDelete.rule_trigger_type', { lng }), value: AutoModerationRuleTriggerType[triggerType] },
            {
              name: t('log.autoModerationRuleDelete.trigger_metadata', { lng }),
              value: [
                `${t('log.autoModerationRuleDelete.keyword_filter', { lng })}: ${
                  triggerMetadata.keywordFilter
                    .map((word) => `\`${word}\``)
                    .join(', ')
                    .slice(0, 200) || '/'
                }`,
                `${t('log.autoModerationRuleDelete.regex_patterns', { lng })}: ${
                  triggerMetadata.regexPatterns
                    .map((pattern) => `\`${pattern}\``)
                    .join(', ')
                    .slice(0, 200) || '/'
                }`,
                `${t('log.autoModerationRuleDelete.mention_total_limit', { lng })}: ${triggerMetadata.mentionTotalLimit || '/'}`,
                `${t('log.autoModerationRuleDelete.mention_raid_protection', { lng })}: ${triggerMetadata.mentionRaidProtectionEnabled}`,
              ].join('\n'),
            },
            {
              name: t('log.autoModerationRuleDelete.action', { lng }),
              value:
                actions
                  .map((action) => `${AutoModerationActionType[action.type]}`)
                  .join('\n')
                  .slice(0, 1000) || '/',
            },
            {
              name: t('log.autoModerationRuleDelete.exempt_roles', { lng }),
              value:
                exemptRoles
                  .map((role) => `<@&${role.id}>`)
                  .join(', ')
                  .slice(0, 1000) || '/',
            },
            {
              name: t('log.autoModerationRuleDelete.exempt_channels', { lng }),
              value:
                exemptChannels
                  .map((channel) => `<#${channel.id}>`)
                  .join(', ')
                  .slice(0, 1000) || '/',
            }
          )
          .setTimestamp(),
      ],
    });
  },
});

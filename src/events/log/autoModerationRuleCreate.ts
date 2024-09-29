import { AutoModerationActionType, AutoModerationRuleTriggerType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildSettings } from 'db/guild';

export default new Event({
  name: Events.AutoModerationRuleCreate,
  once: false,
  async execute(_client, autoModerationRule) {
    const { guild, creatorId, triggerType, triggerMetadata, name, exemptRoles, exemptChannels, actions } = autoModerationRule;

    const config = await getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.autoModerationRuleCreate || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = config.language;

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle(t('log.autoModerationRuleCreate.title', { lng }))
          .addFields(
            {
              name: t('log.autoModerationRuleCreate.created_by', { lng }),
              value: `<@${creatorId}>`
            },
            {
              name: t('log.autoModerationRuleCreate.rule_name', { lng }),
              value: name
            },
            {
              name: t('log.autoModerationRuleCreate.rule_trigger_type', {
                lng
              }),
              value: AutoModerationRuleTriggerType[triggerType]
            },
            {
              name: t('log.autoModerationRuleCreate.trigger_metadata', { lng }),
              value: [
                `${t('log.autoModerationRuleCreate.keyword_filter', { lng })}: ${
                  triggerMetadata.keywordFilter
                    .map((word) => `\`${word}\``)
                    .join(', ')
                    .slice(0, 200) || '/'
                }`,
                `${t('log.autoModerationRuleCreate.regex_patterns', { lng })}: ${
                  triggerMetadata.regexPatterns
                    .map((pattern) => `\`${pattern}\``)
                    .join(', ')
                    .slice(0, 200) || '/'
                }`,
                `${t('log.autoModerationRuleCreate.mention_total_limit', { lng })}: ${triggerMetadata.mentionTotalLimit || '/'}`,
                `${t('log.autoModerationRuleCreate.mention_raid_protection', { lng })}: ${triggerMetadata.mentionRaidProtectionEnabled}`
              ].join('\n')
            },
            {
              name: t('log.autoModerationRuleCreate.action', { lng }),
              value:
                actions
                  .map((action) => `${AutoModerationActionType[action.type]}`)
                  .join('\n')
                  .slice(0, 1000) || '/'
            },
            {
              name: t('log.autoModerationRuleCreate.exempt_roles', { lng }),
              value:
                exemptRoles
                  .map((role) => `<@&${role.id}>`)
                  .join(', ')
                  .slice(0, 1000) || '/'
            },
            {
              name: t('log.autoModerationRuleCreate.exempt_channels', { lng }),
              value:
                exemptChannels
                  .map((channel) => `<#${channel.id}>`)
                  .join(', ')
                  .slice(0, 1000) || '/'
            }
          )
          .setTimestamp()
      ]
    });
  }
});

import { AutoModerationActionType, AutoModerationRuleTriggerType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuild } from 'db/guild';
import { getGuildLanguage } from 'db/language';

export default new Event({
  name: Events.AutoModerationRuleDelete,
  once: false,
  async execute(_client, autoModerationRule) {
    const { guild, creatorId, triggerType, triggerMetadata, name, exemptRoles, exemptChannels, actions } = autoModerationRule;

    const config = (await getGuild(guild.id)) ?? { log: { enabled: false } };

    if (!config.log.enabled || !config.log.events.autoModerationRuleDelete || !config.log.channelId) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = await getGuildLanguage(guild.id);

    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle(t('log.autoModerationRuleDelete.title', { lng }))
          .addFields(
            {
              name: t('log.autoModerationRuleDelete.created-by', { lng }),
              value: `<@${creatorId}>`
            },
            {
              name: t('log.autoModerationRuleDelete.rule-name', { lng }),
              value: name
            },
            {
              name: t('log.autoModerationRuleDelete.rule-trigger-type', {
                lng
              }),
              value: AutoModerationRuleTriggerType[triggerType]
            },
            {
              name: t('log.autoModerationRuleDelete.trigger-metadata', { lng }),
              value: [
                `${t('log.autoModerationRuleDelete.keyword-filter', { lng })}: ${
                  triggerMetadata.keywordFilter
                    .map((word) => `\`${word}\``)
                    .join(', ')
                    .slice(0, 200) || '/'
                }`,
                `${t('log.autoModerationRuleDelete.regex-patterns', { lng })}: ${
                  triggerMetadata.regexPatterns
                    .map((pattern) => `\`${pattern}\``)
                    .join(', ')
                    .slice(0, 200) || '/'
                }`,
                `${t('log.autoModerationRuleDelete.mention-total-limit', { lng })}: ${triggerMetadata.mentionTotalLimit || '/'}`,
                `${t('log.autoModerationRuleDelete.mention-raid-protection', { lng })}: ${triggerMetadata.mentionRaidProtectionEnabled}`
              ].join('\n')
            },
            {
              name: t('log.autoModerationRuleDelete.action', { lng }),
              value:
                actions
                  .map((action) => `${AutoModerationActionType[action.type]}`)
                  .join('\n')
                  .slice(0, 1000) || '/'
            },
            {
              name: t('log.autoModerationRuleDelete.exempt-roles', { lng }),
              value:
                exemptRoles
                  .map((role) => `<@&${role.id}>`)
                  .join(', ')
                  .slice(0, 1000) || '/'
            },
            {
              name: t('log.autoModerationRuleDelete.exempt-channels', { lng }),
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

import { AutoModerationActionType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildSettings } from 'db/guild';

export default new Event({
  name: Events.AutoModerationRuleUpdate,
  once: false,
  async execute(_client, oldAutoModerationRule, newAutoModerationRule) {
    const guild = newAutoModerationRule.guild;

    const config = await getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.autoModerationRuleUpdate || !config.log.channelId || !oldAutoModerationRule || !newAutoModerationRule) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = config.language;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.autoModerationRuleUpdate.title', { lng }))
      .addFields({
        name: t('log.autoModerationRuleUpdate.rule', { lng }),
        value: `\`${newAutoModerationRule.name}\` (${newAutoModerationRule.id})`,
      })
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newAutoModerationRule.name !== oldAutoModerationRule.name)
      embed.addFields(
        {
          name: t('log.autoModerationRuleUpdate.old_name', { lng }),
          value: `\`${oldAutoModerationRule.name}\``,
          inline: true,
        },
        {
          name: t('log.autoModerationRuleUpdate.new_name', { lng }),
          value: `\`${newAutoModerationRule.name}\``,
          inline: true,
        },
        emptyField,
      );
    if (newAutoModerationRule.enabled !== oldAutoModerationRule.enabled)
      embed.addFields(
        {
          name: t('log.autoModerationRuleUpdate.old_enabled', { lng }),
          value: `${oldAutoModerationRule.enabled}`,
          inline: true,
        },
        {
          name: t('log.autoModerationRuleUpdate.new_enabled', { lng }),
          value: `${newAutoModerationRule.enabled}`,
          inline: true,
        },
        emptyField,
      );
    if (JSON.stringify(newAutoModerationRule.actions) !== JSON.stringify(oldAutoModerationRule.actions))
      embed.addFields(
        {
          name: t('log.autoModerationRuleUpdate.old_actions', { lng }),
          value:
            oldAutoModerationRule.actions
              .map((action) => `${AutoModerationActionType[action.type]}`)
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true,
        },
        {
          name: t('log.autoModerationRuleUpdate.new_actions', { lng }),
          value:
            newAutoModerationRule.actions
              .map((action) => `${AutoModerationActionType[action.type]}`)
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true,
        },
        emptyField,
      );
    if (JSON.stringify(newAutoModerationRule.exemptRoles) !== JSON.stringify(oldAutoModerationRule.exemptRoles))
      embed.addFields(
        {
          name: t('log.autoModerationRuleUpdate.old_exempt_roles', { lng }),
          value:
            oldAutoModerationRule.exemptRoles
              .map((role) => `<@&${role.id}>`)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        {
          name: t('log.autoModerationRuleUpdate.new_exempt_roles', { lng }),
          value:
            newAutoModerationRule.exemptRoles
              .map((role) => `<@&${role.id}>`)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        emptyField,
      );
    if (JSON.stringify(newAutoModerationRule.exemptChannels) !== JSON.stringify(oldAutoModerationRule.exemptChannels))
      embed.addFields(
        {
          name: t('log.autoModerationRuleUpdate.old_exempt_channels', { lng }),
          value:
            oldAutoModerationRule.exemptChannels
              .map((role) => `<#${role.id}>`)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        {
          name: t('log.autoModerationRuleUpdate.new_exempt_channels', { lng }),
          value:
            newAutoModerationRule.exemptChannels
              .map((role) => `<#${role.id}>`)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        emptyField,
      );
    if (JSON.stringify(newAutoModerationRule.triggerMetadata) !== JSON.stringify(oldAutoModerationRule.triggerMetadata))
      embed.addFields(
        {
          name: t('log.autoModerationRuleUpdate.old_trigger_metadata', { lng }),
          value: [
            `${t('log.autoModerationRuleUpdate.keyword_filter', { lng })}: ${
              oldAutoModerationRule.triggerMetadata.keywordFilter
                .map((word) => `\`${word}\``)
                .join(', ')
                .slice(0, 200) || '/'
            }`,
            `${t('log.autoModerationRuleUpdate.regex_patterns', { lng })}: ${
              oldAutoModerationRule.triggerMetadata.regexPatterns
                .map((pattern) => `\`${pattern}\``)
                .join(', ')
                .slice(0, 200) || '/'
            }`,
            `${t('log.autoModerationRuleUpdate.mention_total_limit', { lng })}: ${oldAutoModerationRule.triggerMetadata.mentionTotalLimit || '/'}`,
            `${t('log.autoModerationRuleUpdate.mention_raid_protection', { lng })}: ${oldAutoModerationRule.triggerMetadata.mentionRaidProtectionEnabled}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: t('log.autoModerationRuleUpdate.new_trigger_metadata', { lng }),
          value: [
            `${t('log.autoModerationRuleUpdate.keyword_filter', { lng })}: ${
              newAutoModerationRule.triggerMetadata.keywordFilter
                .map((word) => `\`${word}\``)
                .join(', ')
                .slice(0, 200) || '/'
            }`,
            `${t('log.autoModerationRuleUpdate.regex_patterns', { lng })}: ${
              newAutoModerationRule.triggerMetadata.regexPatterns
                .map((pattern) => `\`${pattern}\``)
                .join(', ')
                .slice(0, 200) || '/'
            }`,
            `${t('log.autoModerationRuleUpdate.mention_total_limit', { lng })}: ${newAutoModerationRule.triggerMetadata.mentionTotalLimit || '/'}`,
            `${t('log.autoModerationRuleUpdate.mention_raid_protection', { lng })}: ${newAutoModerationRule.triggerMetadata.mentionRaidProtectionEnabled}`,
          ].join('\n'),
          inline: true,
        },
        emptyField,
      );

    await logChannel.send({
      embeds: [embed],
    });
  },
});

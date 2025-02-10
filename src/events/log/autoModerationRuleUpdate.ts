import { AutoModerationActionType, Colors, EmbedBuilder, Events } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuildLog } from 'db/guild-log';
import { getGuildLanguage } from 'db/language';

import { logger } from 'utils/logger';

import type { LoggedEvent } from 'types/guild-log';

export default new Event({
  name: Events.AutoModerationRuleUpdate,
  once: false,
  async execute(_client, oldAutoModerationRule, newAutoModerationRule) {
    const guild = newAutoModerationRule.guild;

    const log = (await getGuildLog(guild.id)) ?? { enabled: false, events: [] as LoggedEvent[] };

    const event = log.events.find((e) => e.name === Events.AutoModerationRuleUpdate) ?? {
      channelId: undefined,
      enabled: false
    };

    if (!log.enabled || !event.enabled || !event.channelId || !oldAutoModerationRule || !newAutoModerationRule) {
      return;
    }

    const logChannel = await guild.channels
      .fetch(event.channelId)
      .catch((err) => logger.debug({ err }, 'GuildLog | AutoModerationRuleUpdate: Could not fetch channel'));

    if (!logChannel?.isSendable()) {
      return;
    }

    const lng = await getGuildLanguage(guild.id);

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle(t('log.autoModerationRuleUpdate.title', { lng }))
      .addFields({
        name: t('log.autoModerationRuleUpdate.rule', { lng }),
        value: `\`${newAutoModerationRule.name}\` (${newAutoModerationRule.id})`
      })
      .setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newAutoModerationRule.name !== oldAutoModerationRule.name) {
      embed.addFields(
        {
          name: t('log.autoModerationRuleUpdate.old-name', { lng }),
          value: `\`${oldAutoModerationRule.name}\``,
          inline: true
        },
        {
          name: t('log.autoModerationRuleUpdate.new-name', { lng }),
          value: `\`${newAutoModerationRule.name}\``,
          inline: true
        },
        emptyField
      );
    }

    if (newAutoModerationRule.enabled !== oldAutoModerationRule.enabled) {
      embed.addFields(
        {
          name: t('log.autoModerationRuleUpdate.old-enabled', { lng }),
          value: `${oldAutoModerationRule.enabled}`,
          inline: true
        },
        {
          name: t('log.autoModerationRuleUpdate.new-enabled', { lng }),
          value: `${newAutoModerationRule.enabled}`,
          inline: true
        },
        emptyField
      );
    }

    if (JSON.stringify(newAutoModerationRule.actions) !== JSON.stringify(oldAutoModerationRule.actions)) {
      embed.addFields(
        {
          name: t('log.autoModerationRuleUpdate.old-actions', { lng }),
          value:
            oldAutoModerationRule.actions
              .map((action) => `${AutoModerationActionType[action.type]}`)
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true
        },
        {
          name: t('log.autoModerationRuleUpdate.new-actions', { lng }),
          value:
            newAutoModerationRule.actions
              .map((action) => `${AutoModerationActionType[action.type]}`)
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true
        },
        emptyField
      );
    }

    if (JSON.stringify(newAutoModerationRule.exemptRoles) !== JSON.stringify(oldAutoModerationRule.exemptRoles)) {
      embed.addFields(
        {
          name: t('log.autoModerationRuleUpdate.old-exempt-roles', { lng }),
          value:
            oldAutoModerationRule.exemptRoles
              .map((role) => `<@&${role.id}>`)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true
        },
        {
          name: t('log.autoModerationRuleUpdate.new-exempt-roles', { lng }),
          value:
            newAutoModerationRule.exemptRoles
              .map((role) => `<@&${role.id}>`)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true
        },
        emptyField
      );
    }

    if (JSON.stringify(newAutoModerationRule.exemptChannels) !== JSON.stringify(oldAutoModerationRule.exemptChannels)) {
      embed.addFields(
        {
          name: t('log.autoModerationRuleUpdate.old-exempt-channels', { lng }),
          value:
            oldAutoModerationRule.exemptChannels
              .map((role) => `<#${role.id}>`)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true
        },
        {
          name: t('log.autoModerationRuleUpdate.new-exempt-channels', { lng }),
          value:
            newAutoModerationRule.exemptChannels
              .map((role) => `<#${role.id}>`)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true
        },
        emptyField
      );
    }

    if (JSON.stringify(newAutoModerationRule.triggerMetadata) !== JSON.stringify(oldAutoModerationRule.triggerMetadata)) {
      embed.addFields(
        {
          name: t('log.autoModerationRuleUpdate.old-trigger-metadata', { lng }),
          value: [
            `${t('log.autoModerationRuleUpdate.keyword-filter', { lng })}: ${
              oldAutoModerationRule.triggerMetadata.keywordFilter
                .map((word) => `\`${word}\``)
                .join(', ')
                .slice(0, 200) || '/'
            }`,
            `${t('log.autoModerationRuleUpdate.regex-patterns', { lng })}: ${
              oldAutoModerationRule.triggerMetadata.regexPatterns
                .map((pattern) => `\`${pattern}\``)
                .join(', ')
                .slice(0, 200) || '/'
            }`,
            `${t('log.autoModerationRuleUpdate.mention-total-limit', { lng })}: ${oldAutoModerationRule.triggerMetadata.mentionTotalLimit || '/'}`,
            `${t('log.autoModerationRuleUpdate.mention-raid-protection', { lng })}: ${oldAutoModerationRule.triggerMetadata.mentionRaidProtectionEnabled}`
          ].join('\n'),
          inline: true
        },
        {
          name: t('log.autoModerationRuleUpdate.new-trigger-metadata', { lng }),
          value: [
            `${t('log.autoModerationRuleUpdate.keyword-filter', { lng })}: ${
              newAutoModerationRule.triggerMetadata.keywordFilter
                .map((word) => `\`${word}\``)
                .join(', ')
                .slice(0, 200) || '/'
            }`,
            `${t('log.autoModerationRuleUpdate.regex-patterns', { lng })}: ${
              newAutoModerationRule.triggerMetadata.regexPatterns
                .map((pattern) => `\`${pattern}\``)
                .join(', ')
                .slice(0, 200) || '/'
            }`,
            `${t('log.autoModerationRuleUpdate.mention-total-limit', { lng })}: ${newAutoModerationRule.triggerMetadata.mentionTotalLimit || '/'}`,
            `${t('log.autoModerationRuleUpdate.mention-raid-protection', { lng })}: ${newAutoModerationRule.triggerMetadata.mentionRaidProtectionEnabled}`
          ].join('\n'),
          inline: true
        },
        emptyField
      );
    }

    await logChannel
      .send({
        embeds: [embed]
      })
      .catch((err) => logger.debug({ err }, 'GuildLog | AutoModerationRuleUpdate: Could not send message'));
  }
});

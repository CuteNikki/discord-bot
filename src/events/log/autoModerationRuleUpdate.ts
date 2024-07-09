import { AutoModerationActionType, ChannelType, Colors, EmbedBuilder, Events } from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.AutoModerationRuleUpdate,
  once: false,
  async execute(client, oldAutoModerationRule, newAutoModerationRule) {
    const guild = newAutoModerationRule.guild;

    const config = await client.getGuildSettings(guild.id);

    if (!config.log.enabled || !config.log.events.autoModerationRuleUpdate || !config.log.channelId || !oldAutoModerationRule || !newAutoModerationRule) return;

    const logChannel = await guild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const embed = new EmbedBuilder()
      .setColor(Colors.Yellow)
      .setTitle('Auto Moderation Rule Update')
      .addFields({ name: 'Rule', value: `\`${newAutoModerationRule.name}\` (${newAutoModerationRule.id})` });

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newAutoModerationRule.name !== oldAutoModerationRule.name)
      embed.addFields(
        { name: 'Old Name', value: `\`${oldAutoModerationRule.name}\``, inline: true },
        { name: 'New Name', value: `\`${newAutoModerationRule.name}\``, inline: true },
        emptyField
      );
    if (newAutoModerationRule.enabled !== oldAutoModerationRule.enabled)
      embed.addFields(
        { name: 'Old Enabled', value: `${oldAutoModerationRule.enabled}`, inline: true },
        { name: 'New Enabled', value: `${newAutoModerationRule.enabled}`, inline: true },
        emptyField
      );
    if (JSON.stringify(newAutoModerationRule.actions) !== JSON.stringify(oldAutoModerationRule.actions))
      embed.addFields(
        {
          name: 'Old Actions',
          value:
            oldAutoModerationRule.actions
              .map((action) => `${AutoModerationActionType[action.type]}`)
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true,
        },
        {
          name: 'New Actions',
          value:
            newAutoModerationRule.actions
              .map((action) => `${AutoModerationActionType[action.type]}`)
              .join('\n')
              .slice(0, 1000) || '/',
          inline: true,
        },
        emptyField
      );
    if (JSON.stringify(newAutoModerationRule.exemptRoles) !== JSON.stringify(oldAutoModerationRule.exemptRoles))
      embed.addFields(
        {
          name: 'Old Exempt Roles',
          value:
            oldAutoModerationRule.exemptRoles
              .map((role) => `<@&${role.id}>`)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        {
          name: 'New Exempt Roles',
          value:
            newAutoModerationRule.exemptRoles
              .map((role) => `<@&${role.id}>`)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        emptyField
      );
    if (JSON.stringify(newAutoModerationRule.exemptChannels) !== JSON.stringify(oldAutoModerationRule.exemptChannels))
      embed.addFields(
        {
          name: 'Old Exempt Channels',
          value:
            oldAutoModerationRule.exemptChannels
              .map((role) => `<#${role.id}>`)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        {
          name: 'New Exempt Channels',
          value:
            newAutoModerationRule.exemptChannels
              .map((role) => `<#${role.id}>`)
              .join(', ')
              .slice(0, 1000) || '/',
          inline: true,
        },
        emptyField
      );
    if (JSON.stringify(newAutoModerationRule.triggerMetadata) !== JSON.stringify(oldAutoModerationRule.triggerMetadata))
      embed.addFields(
        {
          name: 'Old Trigger Metadata',
          value: [
            `Keyword Filter: ${
              oldAutoModerationRule.triggerMetadata.keywordFilter
                .map((word) => `\`${word}\``)
                .join(', ')
                .slice(0, 200) || '/'
            }`,
            `Regex Patterns: ${
              oldAutoModerationRule.triggerMetadata.regexPatterns
                .map((pattern) => `\`${pattern}\``)
                .join(', ')
                .slice(0, 200) || '/'
            }`,
            `Mention Total Limit: ${oldAutoModerationRule.triggerMetadata.mentionTotalLimit || '/'}`,
            `Mention Raid Protection: ${oldAutoModerationRule.triggerMetadata.mentionRaidProtectionEnabled}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: 'New Trigger Metadata',
          value: [
            `Keyword Filter: ${
              newAutoModerationRule.triggerMetadata.keywordFilter
                .map((word) => `\`${word}\``)
                .join(', ')
                .slice(0, 200) || '/'
            }`,
            `Regex Patterns: ${
              newAutoModerationRule.triggerMetadata.regexPatterns
                .map((pattern) => `\`${pattern}\``)
                .join(', ')
                .slice(0, 200) || '/'
            }`,
            `Mention Total Limit: ${newAutoModerationRule.triggerMetadata.mentionTotalLimit || '/'}`,
            `Mention Raid Protection: ${newAutoModerationRule.triggerMetadata.mentionRaidProtectionEnabled}`,
          ].join('\n'),
          inline: true,
        },
        emptyField
      );

    await logChannel.send({
      embeds: [embed],
    });
  },
});

import {
  Colors,
  EmbedBuilder,
  Events,
  GuildDefaultMessageNotifications,
  GuildExplicitContentFilter,
  GuildMFALevel,
  GuildNSFWLevel,
  GuildVerificationLevel
} from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getGuild } from 'db/guild';

export default new Event({
  name: Events.GuildUpdate,
  once: false,
  async execute(_client, oldGuild, newGuild) {
    const config = await getGuild(newGuild.id);

    if (!config.log.enabled || !config.log.events.guildUpdate || !config.log.channelId) return;

    const logChannel = await newGuild.channels.fetch(config.log.channelId);
    if (!logChannel?.isSendable()) return;

    const lng = config.language;

    const embed = new EmbedBuilder().setColor(Colors.Yellow).setTitle(t('log.guildUpdate.title', { lng })).setTimestamp();

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newGuild.name !== oldGuild.name)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-name', { lng }),
          value: oldGuild.name,
          inline: true
        },
        {
          name: t('log.guildUpdate.new-name', { lng }),
          value: newGuild.name,
          inline: true
        },
        emptyField
      );
    if (newGuild.description !== oldGuild.description)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-description', { lng }),
          value: oldGuild.description ?? '/',
          inline: true
        },
        {
          name: t('log.guildUpdate.new-description', { lng }),
          value: newGuild.description ?? '/',
          inline: true
        },
        emptyField
      );
    if (newGuild.preferredLocale !== oldGuild.preferredLocale)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-preferred-locale', { lng }),
          value: oldGuild.preferredLocale,
          inline: true
        },
        {
          name: t('log.guildUpdate.new-preferred-locale', { lng }),
          value: newGuild.preferredLocale,
          inline: true
        },
        emptyField
      );
    if (newGuild.icon !== oldGuild.icon)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-icon', { lng }),
          value: oldGuild.iconURL() ?? '/',
          inline: true
        },
        {
          name: t('log.guildUpdate.new-icon', { lng }),
          value: newGuild.iconURL() ?? '/',
          inline: true
        },
        emptyField
      );
    if (newGuild.discoverySplash !== oldGuild.discoverySplash)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-discovery-splash', { lng }),
          value: oldGuild.discoverySplashURL() || '/',
          inline: true
        },
        {
          name: t('log.guildUpdate.new-discovery-splash', { lng }),
          value: newGuild.discoverySplashURL() || '/',
          inline: true
        },
        emptyField
      );
    if (newGuild.banner !== oldGuild.banner)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-banner', { lng }),
          value: oldGuild.bannerURL() ?? '/',
          inline: true
        },
        {
          name: t('log.guildUpdate.new-banner', { lng }),
          value: newGuild.bannerURL() ?? '/',
          inline: true
        },
        emptyField
      );
    if (newGuild.premiumProgressBarEnabled !== oldGuild.premiumProgressBarEnabled)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-premium-progress-bar-enabled', { lng }),
          value: `${oldGuild.premiumProgressBarEnabled}`,
          inline: true
        },
        {
          name: t('log.guildUpdate.new-premium-progress-bar-enabled', { lng }),
          value: `${newGuild.premiumProgressBarEnabled}`,
          inline: true
        },
        emptyField
      );
    if (newGuild.defaultMessageNotifications !== oldGuild.defaultMessageNotifications)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-default-message-notifications', { lng }),
          value: GuildDefaultMessageNotifications[oldGuild.defaultMessageNotifications],
          inline: true
        },
        {
          name: t('log.guildUpdate.new-default-message-notifications', { lng }),
          value: GuildDefaultMessageNotifications[newGuild.defaultMessageNotifications],
          inline: true
        },
        emptyField
      );
    if (newGuild.mfaLevel !== oldGuild.mfaLevel)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-mfa-level', { lng }),
          value: GuildMFALevel[oldGuild.mfaLevel],
          inline: true
        },
        {
          name: t('log.guildUpdate.new-mfa-level', { lng }),
          value: GuildMFALevel[newGuild.mfaLevel],
          inline: true
        },
        emptyField
      );
    if (newGuild.nsfwLevel !== oldGuild.nsfwLevel)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-nsfw-level', { lng }),
          value: GuildNSFWLevel[oldGuild.nsfwLevel],
          inline: true
        },
        {
          name: t('log.guildUpdate.new-nsfw-level', { lng }),
          value: GuildNSFWLevel[newGuild.nsfwLevel],
          inline: true
        },
        emptyField
      );
    if (newGuild.verificationLevel !== oldGuild.verificationLevel)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-verification-level', { lng }),
          value: GuildVerificationLevel[oldGuild.verificationLevel],
          inline: true
        },
        {
          name: t('log.guildUpdate.new-verification-level', { lng }),
          value: GuildVerificationLevel[newGuild.verificationLevel],
          inline: true
        },
        emptyField
      );
    if (newGuild.explicitContentFilter !== oldGuild.explicitContentFilter)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-explicit-content-filter', { lng }),
          value: GuildExplicitContentFilter[oldGuild.explicitContentFilter],
          inline: true
        },
        {
          name: t('log.guildUpdate.new-explicit-content-filter', { lng }),
          value: GuildExplicitContentFilter[newGuild.explicitContentFilter],
          inline: true
        },
        emptyField
      );
    if (newGuild.ownerId !== oldGuild.ownerId)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-owner', { lng }),
          value: `<@${oldGuild.ownerId}>`,
          inline: true
        },
        {
          name: t('log.guildUpdate.new-owner', { lng }),
          value: `<@${newGuild.ownerId}>`,
          inline: true
        },
        emptyField
      );
    if (newGuild.vanityURLCode !== oldGuild.vanityURLCode)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-vanity-url', { lng }),
          value: oldGuild.vanityURLCode ?? '/',
          inline: true
        },
        {
          name: t('log.guildUpdate.new-vanity-url', { lng }),
          value: newGuild.vanityURLCode ?? '/',
          inline: true
        },
        emptyField
      );
    if ((newGuild.widgetEnabled || false) !== (oldGuild.widgetEnabled || false))
      embed.addFields(
        {
          name: t('log.guildUpdate.old-widget-enabled', { lng }),
          value: `${oldGuild.widgetEnabled}`,
          inline: true
        },
        {
          name: t('log.guildUpdate.new-widget-enabled', { lng }),
          value: `${newGuild.widgetEnabled}`,
          inline: true
        },
        emptyField
      );
    if (newGuild.widgetChannelId !== oldGuild.widgetChannelId)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-widget-channel', { lng }),
          value: oldGuild.widgetChannel ? `${oldGuild.widgetChannel.toString()} (\`${oldGuild.widgetChannel.name}\` | ${oldGuild.widgetChannelId})` : '/',
          inline: true
        },
        {
          name: t('log.guildUpdate.new-widget-channel', { lng }),
          value: newGuild.widgetChannel ? `${newGuild.widgetChannel.toString()} (\`${newGuild.widgetChannel.name}\` | ${newGuild.widgetChannelId})` : '/',
          inline: true
        },
        emptyField
      );
    if (newGuild.afkTimeout !== oldGuild.afkTimeout)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-afk-timeout', { lng }),
          value: `${oldGuild.afkTimeout / 60}min`,
          inline: true
        },
        {
          name: t('log.guildUpdate.new-afk-timeout', { lng }),
          value: `${newGuild.afkTimeout / 60}min`,
          inline: true
        },
        emptyField
      );
    if (newGuild.afkChannelId !== oldGuild.afkChannelId)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-afk-channel', { lng }),
          value: oldGuild.afkChannel ? `${oldGuild.afkChannel.toString()} (\`${oldGuild.afkChannel.name}\` | ${oldGuild.afkChannelId})` : '/',
          inline: true
        },
        {
          name: t('log.guildUpdate.new-afk-channel', { lng }),
          value: newGuild.afkChannel ? `${newGuild.afkChannel.toString()} (\`${newGuild.afkChannel.name}\` | ${newGuild.afkChannelId})` : '/',
          inline: true
        },
        emptyField
      );
    if (newGuild.publicUpdatesChannelId !== oldGuild.publicUpdatesChannelId)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-public-updates-channel', { lng }),
          value: oldGuild.publicUpdatesChannel
            ? `${oldGuild.publicUpdatesChannel.toString()} (\`${oldGuild.publicUpdatesChannel.name}\` | ${oldGuild.publicUpdatesChannelId})`
            : '/',
          inline: true
        },
        {
          name: t('log.guildUpdate.new-public-updates-channel', { lng }),
          value: newGuild.publicUpdatesChannel
            ? `${newGuild.publicUpdatesChannel.toString()} (\`${newGuild.publicUpdatesChannel.name}\` | ${newGuild.publicUpdatesChannelId})`
            : '/',
          inline: true
        },
        emptyField
      );
    if (newGuild.rulesChannelId !== oldGuild.rulesChannelId)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-rules-channel', { lng }),
          value: oldGuild.rulesChannel ? `${oldGuild.rulesChannel.toString()} (\`${oldGuild.rulesChannel.name}\` | ${oldGuild.rulesChannelId})` : '/',
          inline: true
        },
        {
          name: t('log.guildUpdate.new-rules-channel', { lng }),
          value: newGuild.rulesChannel ? `${newGuild.rulesChannel.toString()} (\`${newGuild.rulesChannel.name}\` | ${newGuild.rulesChannelId})` : '/',
          inline: true
        },
        emptyField
      );
    if (newGuild.safetyAlertsChannelId !== oldGuild.safetyAlertsChannelId)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-safety-alerts-channel', { lng }),
          value: oldGuild.safetyAlertsChannel
            ? `${oldGuild.safetyAlertsChannel.toString()} (\`${oldGuild.safetyAlertsChannel.name}\` | ${oldGuild.rulesChannelId})`
            : '/',
          inline: true
        },
        {
          name: t('log.guildUpdate.new-safety-alerts-channel', { lng }),
          value: newGuild.safetyAlertsChannel
            ? `${newGuild.safetyAlertsChannel.toString()} (\`${newGuild.safetyAlertsChannel.name}\` | ${newGuild.safetyAlertsChannelId})`
            : '/',
          inline: true
        },
        emptyField
      );
    if (newGuild.systemChannelId !== oldGuild.systemChannelId)
      embed.addFields(
        {
          name: t('log.guildUpdate.old-system-channel', { lng }),
          value: oldGuild.systemChannel ? `${oldGuild.systemChannel.toString()} (\`${oldGuild.systemChannel.name}\` | ${oldGuild.systemChannelId})` : '/',
          inline: true
        },
        {
          name: t('log.guildUpdate.new-system-channel', { lng }),
          value: newGuild.systemChannel ? `${newGuild.systemChannel.toString()} (\`${newGuild.systemChannel.name}\` | ${newGuild.systemChannelId})` : '/',
          inline: true
        },
        emptyField
      );

    const embedData = embed.toJSON();
    if (!embedData.fields?.length || embedData.fields.length > 25) return;

    await logChannel.send({
      embeds: [embed]
    });
  }
});

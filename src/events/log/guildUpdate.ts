import {
  ChannelType,
  Colors,
  EmbedBuilder,
  Events,
  GuildDefaultMessageNotifications,
  GuildExplicitContentFilter,
  GuildMFALevel,
  GuildNSFWLevel,
  GuildVerificationLevel,
} from 'discord.js';

import { Event } from 'classes/event';

export default new Event({
  name: Events.GuildUpdate,
  once: false,
  async execute(client, oldGuild, newGuild) {
    const config = await client.getGuildSettings(newGuild.id);

    if (!config.log.events.guildUpdate || !config.log.channelId) return;

    const logChannel = await newGuild.channels.fetch(config.log.channelId);
    if (!logChannel || logChannel.type !== ChannelType.GuildText) return;

    const embed = new EmbedBuilder().setColor(Colors.Yellow).setTitle('Guild Update');

    const emptyField = { name: '\u200b', value: '\u200b', inline: true };

    if (newGuild.name !== oldGuild.name)
      embed.addFields({ name: 'Old Name', value: oldGuild.name, inline: true }, { name: 'New Name', value: newGuild.name, inline: true }, emptyField);
    if (newGuild.description !== oldGuild.description)
      embed.addFields(
        { name: 'Old Description', value: oldGuild.description || '/', inline: true },
        { name: 'New Description', value: newGuild.description || '/', inline: true },
        emptyField
      );
    if (newGuild.preferredLocale !== oldGuild.preferredLocale)
      embed.addFields(
        { name: 'Old Preferred Locale', value: oldGuild.preferredLocale, inline: true },
        { name: 'New Preferred Locale', value: newGuild.preferredLocale, inline: true },
        emptyField
      );
    if (newGuild.icon !== oldGuild.icon)
      embed.addFields(
        { name: 'Old Icon', value: oldGuild.iconURL() || '/', inline: true },
        { name: 'New Icon', value: newGuild.iconURL() || '/', inline: true },
        emptyField
      );
    if (newGuild.discoverySplash !== oldGuild.discoverySplash)
      embed.addFields(
        { name: 'Old Invite Background', value: oldGuild.discoverySplashURL() || '/', inline: true },
        { name: 'New Invite Background', value: newGuild.discoverySplashURL() || '/', inline: true },
        emptyField
      );
    if (newGuild.banner !== oldGuild.banner)
      embed.addFields(
        { name: 'Old Banner', value: oldGuild.bannerURL() || '/', inline: true },
        { name: 'New Banner', value: newGuild.bannerURL() || '/', inline: true },
        emptyField
      );
    if (newGuild.premiumProgressBarEnabled !== oldGuild.premiumProgressBarEnabled)
      embed.addFields(
        { name: 'Old Premium Progress Bar Enabled', value: `${oldGuild.premiumProgressBarEnabled}`, inline: true },
        { name: 'New Premium Progress Bar Enabled', value: `${newGuild.premiumProgressBarEnabled}`, inline: true },
        emptyField
      );
    if (newGuild.defaultMessageNotifications !== oldGuild.defaultMessageNotifications)
      embed.addFields(
        { name: 'Old Default Message Notifications', value: GuildDefaultMessageNotifications[oldGuild.defaultMessageNotifications], inline: true },
        { name: 'New Default Message Notifications', value: GuildDefaultMessageNotifications[newGuild.defaultMessageNotifications], inline: true },
        emptyField
      );
    if (newGuild.mfaLevel !== oldGuild.mfaLevel)
      embed.addFields(
        { name: 'Old Multi-Factor Authentication', value: GuildMFALevel[oldGuild.mfaLevel], inline: true },
        { name: 'New Multi-Factor Authentication', value: GuildMFALevel[newGuild.mfaLevel], inline: true },
        emptyField
      );
    if (newGuild.nsfwLevel !== oldGuild.nsfwLevel)
      embed.addFields(
        { name: 'Old Multi-Factor Authentication', value: GuildNSFWLevel[oldGuild.nsfwLevel], inline: true },
        { name: 'New Multi-Factor Authentication', value: GuildNSFWLevel[newGuild.nsfwLevel], inline: true },
        emptyField
      );
    if (newGuild.verificationLevel !== oldGuild.verificationLevel)
      embed.addFields(
        { name: 'Old Verification Level', value: GuildVerificationLevel[oldGuild.verificationLevel], inline: true },
        { name: 'New Verification Level', value: GuildVerificationLevel[newGuild.verificationLevel], inline: true },
        emptyField
      );
    if (newGuild.explicitContentFilter !== oldGuild.explicitContentFilter)
      embed.addFields(
        { name: 'Old Verification Level', value: GuildExplicitContentFilter[oldGuild.explicitContentFilter], inline: true },
        { name: 'New Verification Level', value: GuildExplicitContentFilter[newGuild.explicitContentFilter], inline: true },
        emptyField
      );
    if (newGuild.ownerId !== oldGuild.ownerId)
      embed.addFields(
        { name: 'Old Owner', value: `<@${oldGuild.ownerId}>`, inline: true },
        { name: 'New Owner', value: `<@${newGuild.ownerId}>`, inline: true },
        emptyField
      );
    if (newGuild.vanityURLCode !== oldGuild.vanityURLCode)
      embed.addFields(
        { name: 'Old Vanity URL', value: oldGuild.vanityURLCode || '/', inline: true },
        { name: 'New Vanity URL', value: newGuild.vanityURLCode || '/', inline: true },
        emptyField
      );
    if ((newGuild.widgetEnabled || false) !== (oldGuild.widgetEnabled || false))
      embed.addFields(
        { name: 'Old Widget Enabled', value: `${oldGuild.widgetEnabled}`, inline: true },
        { name: 'New Widget Enabled', value: `${newGuild.widgetEnabled}`, inline: true },
        emptyField
      );
    if (newGuild.widgetChannelId !== oldGuild.widgetChannelId)
      embed.addFields(
        {
          name: 'Old Widget Channel',
          value: oldGuild.widgetChannel ? `${oldGuild.widgetChannel.toString()} (\`${oldGuild.widgetChannel.name}\` | ${oldGuild.widgetChannelId})` : '/',
          inline: true,
        },
        {
          name: 'New Widget Channel',
          value: newGuild.widgetChannel ? `${newGuild.widgetChannel.toString()} (\`${newGuild.widgetChannel.name}\` | ${newGuild.widgetChannelId})` : '/',
          inline: true,
        },
        emptyField
      );
    if (newGuild.afkTimeout !== oldGuild.afkTimeout)
      embed.addFields(
        { name: 'Old AFK Timeout', value: `${oldGuild.afkTimeout / 60}min`, inline: true },
        { name: 'New AFK Timeout', value: `${newGuild.afkTimeout / 60}min`, inline: true },
        emptyField
      );
    if (newGuild.afkChannelId !== oldGuild.afkChannelId)
      embed.addFields(
        {
          name: 'Old AFK Channel',
          value: oldGuild.afkChannel ? `${oldGuild.afkChannel.toString()} (\`${oldGuild.afkChannel.name}\` | ${oldGuild.afkChannelId})` : '/',
          inline: true,
        },
        {
          name: 'New AFK Channel',
          value: newGuild.afkChannel ? `${newGuild.afkChannel.toString()} (\`${newGuild.afkChannel.name}\` | ${newGuild.afkChannelId})` : '/',
          inline: true,
        },
        emptyField
      );
    if (newGuild.publicUpdatesChannelId !== oldGuild.publicUpdatesChannelId)
      embed.addFields(
        {
          name: 'Old Public Updates Channel',
          value: oldGuild.publicUpdatesChannel
            ? `${oldGuild.publicUpdatesChannel.toString()} (\`${oldGuild.publicUpdatesChannel.name}\` | ${oldGuild.publicUpdatesChannelId})`
            : '/',
          inline: true,
        },
        {
          name: 'New Public Updates Channel',
          value: newGuild.publicUpdatesChannel
            ? `${newGuild.publicUpdatesChannel.toString()} (\`${newGuild.publicUpdatesChannel.name}\` | ${newGuild.publicUpdatesChannelId})`
            : '/',
          inline: true,
        },
        emptyField
      );
    if (newGuild.rulesChannelId !== oldGuild.rulesChannelId)
      embed.addFields(
        {
          name: 'Old Rules Channel',
          value: oldGuild.rulesChannel ? `${oldGuild.rulesChannel.toString()} (\`${oldGuild.rulesChannel.name}\` | ${oldGuild.rulesChannelId})` : '/',
          inline: true,
        },
        {
          name: 'New Rules Channel',
          value: newGuild.rulesChannel ? `${newGuild.rulesChannel.toString()} (\`${newGuild.rulesChannel.name}\` | ${newGuild.rulesChannelId})` : '/',
          inline: true,
        },
        emptyField
      );
    if (newGuild.safetyAlertsChannelId !== oldGuild.safetyAlertsChannelId)
      embed.addFields(
        {
          name: 'Old Safety Alerts Channel',
          value: oldGuild.safetyAlertsChannel
            ? `${oldGuild.safetyAlertsChannel.toString()} (\`${oldGuild.safetyAlertsChannel.name}\` | ${oldGuild.rulesChannelId})`
            : '/',
          inline: true,
        },
        {
          name: 'New Safety Alerts Channel',
          value: newGuild.safetyAlertsChannel
            ? `${newGuild.safetyAlertsChannel.toString()} (\`${newGuild.safetyAlertsChannel.name}\` | ${newGuild.safetyAlertsChannelId})`
            : '/',
          inline: true,
        },
        emptyField
      );
    if (newGuild.systemChannelId !== oldGuild.systemChannelId)
      embed.addFields(
        {
          name: 'Old System Channel',
          value: oldGuild.systemChannel ? `${oldGuild.systemChannel.toString()} (\`${oldGuild.systemChannel.name}\` | ${oldGuild.systemChannelId})` : '/',
          inline: true,
        },
        {
          name: 'New Safety Alerts Channel',
          value: newGuild.systemChannel ? `${newGuild.systemChannel.toString()} (\`${newGuild.systemChannel.name}\` | ${newGuild.systemChannelId})` : '/',
          inline: true,
        },
        emptyField
      );

    const embedData = embed.toJSON();
    if (!embedData.fields?.length || embedData.fields.length > 25) return;

    await logChannel.send({
      embeds: [embed],
    });
  },
});

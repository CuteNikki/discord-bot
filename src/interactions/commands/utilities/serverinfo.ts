import {
  ApplicationIntegrationType,
  ChannelType,
  EmbedBuilder,
  GuildExplicitContentFilter,
  GuildNSFWLevel,
  GuildPremiumTier,
  GuildVerificationLevel,
  InteractionContextType,
  Role,
  SlashCommandBuilder
} from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

export default new Command({
  module: ModuleType.Utilities,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Get information about the server')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to false will show the message to everyone')),
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const guild = await interaction.guild.fetch();
    const { channels, emojis, roles, stickers, members, memberCount } = guild;

    const sortedRoles = roles.cache
      .map((r) => r)
      .sort((a, b) => b.position - a.position)
      .slice(0, roles.cache.size - 1);

    const userRoles = sortedRoles.filter((role) => !role.managed);
    const managedRoles = sortedRoles.filter((role) => role.managed);

    function maxDisplayRoles(roles: Role[]) {
      const results: string[] = [];
      let totalLength = 0;
      for (const role of roles) {
        const roleString = `<@&${role.id}> `;
        if (roleString.length + totalLength > 1000) break;
        results.push(roleString);
        totalLength += roleString.length;
      }
      return results;
    }
    function maxDisplayFeatures() {
      const results: string[] = [];
      let totalLength = 0;
      const features = guild.features.map((feature) => feature.toLowerCase().replace(/_/g, ' ')).sort((a, b) => b.localeCompare(a));
      for (const feature of features) {
        const featureString = `\`${feature.toLowerCase().replace(/_/g, ' ')}\` `;
        if (featureString.length + totalLength > 1000) break;
        results.push(featureString);
        totalLength += featureString.length;
      }
      return results;
    }

    const totalMembers = memberCount;
    const botMembers = members.cache.filter((member) => member.user.bot).size;
    const humanMembers = members.cache.filter((member) => !member.user.bot).size;

    function getChannelCount(types: ChannelType[]) {
      return channels.cache.filter((channel) => types.includes(channel.type)).size;
    }
    const totalChannels = channels.cache.size;
    const categoryChannels = getChannelCount([ChannelType.GuildCategory]);
    const textChannels = getChannelCount([ChannelType.GuildText, ChannelType.GuildAnnouncement]);
    const voiceChannels = getChannelCount([ChannelType.GuildVoice, ChannelType.GuildStageVoice]);
    const threadChannels = getChannelCount([ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread]);
    const otherChannels = getChannelCount([ChannelType.GuildDirectory, ChannelType.GuildForum, ChannelType.GuildMedia]);

    const totalEmojis = emojis.cache.size;
    const animatedEmojis = emojis.cache.filter((emoji) => emoji.animated).size;
    const staticEmojis = emojis.cache.filter((emoji) => !emoji.animated).size;
    const totalStickers = stickers.cache.size;

    const serverEmbed = new EmbedBuilder()
      .setColor(client.colors.utilities)
      .setThumbnail(guild.iconURL({ size: 4096, extension: 'webp' }))
      .addFields(
        {
          name: t('serverinfo.server.title', { lng }),
          value: [
            t('serverinfo.server.name', {
              lng,
              name: `${guild.name}\n${guild.id}`
            }),
            t('serverinfo.server.created', {
              lng,
              created: `<t:${Math.floor(guild.createdTimestamp / 1000)}:d> | <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`
            }),
            t('serverinfo.server.owner', { lng, owner: `<@${guild.ownerId}> ${client.customEmojis.server_owner}` }),
            t('serverinfo.server.vanity', {
              lng,
              vanity: guild.vanityURLCode ?? t('none', { lng })
            })
          ].join('\n')
        },
        {
          name: t('serverinfo.channels.title', { lng }),
          value: [
            t('serverinfo.channels.total', { lng, total: totalChannels.toString() }),
            t('serverinfo.channels.categories', {
              lng,
              categories: categoryChannels
            }),
            t('serverinfo.channels.text', { lng, text: textChannels.toString() }),
            t('serverinfo.channels.voice', { lng, voice: voiceChannels.toString() }),
            t('serverinfo.channels.threads', { lng, threads: threadChannels.toString() }),
            t('serverinfo.channels.other', { lng, other: otherChannels.toString() })
          ].join('\n'),
          inline: true
        },
        {
          name: t('serverinfo.members.title', { lng }),
          value: [
            t('serverinfo.members.total', { lng, total: totalMembers.toString() }),
            t('serverinfo.members.bots', { lng, bots: botMembers.toString() }),
            t('serverinfo.members.humans', { lng, humans: humanMembers.toString() })
          ].join('\n'),
          inline: true
        },
        {
          name: t('serverinfo.boost.title', { lng }),
          value: [
            t('serverinfo.boost.tier', { lng, tier: GuildPremiumTier[guild.premiumTier] }),
            t('serverinfo.boost.count', {
              lng,
              boosts: guild.premiumSubscriptionCount
            }),
            t('serverinfo.boost.users', {
              lng,
              boosters: members.cache.filter((member) => member.premiumSinceTimestamp).size.toString()
            })
          ].join('\n'),
          inline: true
        },
        {
          name: t('serverinfo.security.title', { lng }),
          value: [
            t('serverinfo.security.explicit-filter', {
              lng,
              filter: GuildExplicitContentFilter[guild.explicitContentFilter]
            }),
            t('serverinfo.security.nsfw-level', {
              lng,
              level: GuildNSFWLevel[guild.nsfwLevel]
            }),
            t('serverinfo.security.verification-level', {
              lng,
              level: GuildVerificationLevel[guild.verificationLevel]
            })
          ].join('\n'),
          inline: true
        }
      );
    if (guild.description) {
      serverEmbed.setDescription(guild.description);
    }
    if (totalEmojis) {
      serverEmbed.addFields({
        name: t('serverinfo.emojis.title'),
        value: [
          t('serverinfo.emojis.total', { lng, total: totalEmojis.toString() }),
          t('serverinfo.emojis.animated', { lng, animated: animatedEmojis.toString() }),
          t('serverinfo.emojis.static', { lng, static: staticEmojis.toString() }),
          t('serverinfo.emojis.stickers', { lng, total: totalStickers.toString() })
        ].join('\n'),
        inline: true
      });
    }
    if (userRoles.length) {
      const displayUserRoles = maxDisplayRoles(userRoles);
      serverEmbed.addFields({
        name: t('serverinfo.user-roles', {
          lng,
          showing: displayUserRoles.length,
          total: userRoles.length
        }),
        value: displayUserRoles.join('')
      });
    }
    if (managedRoles.length) {
      const displayManagedRoles = maxDisplayRoles(managedRoles);
      serverEmbed.addFields({
        name: t('serverinfo.managed-roles', {
          lng,
          showing: displayManagedRoles.length,
          total: managedRoles.length
        }),
        value: displayManagedRoles.join('')
      });
    }
    if (guild.features.length) {
      const displayFeatures = maxDisplayFeatures();
      serverEmbed.addFields({
        name: t('serverinfo.features', { lng, showing: displayFeatures.length.toString(), total: guild.features.length.toString() }),
        value: displayFeatures.join('')
      });
    }
    if (guild.banner) {
      serverEmbed
        .addFields({
          name: t('serverinfo.banner', { lng }),
          value: '** **'
        })
        .setImage(guild.bannerURL({ size: 4096, extension: 'webp' }));
    }
    await interaction.editReply({
      embeds: [serverEmbed]
    });
  }
});

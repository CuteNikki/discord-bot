import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  Colors,
  EmbedBuilder,
  GuildExplicitContentFilter,
  GuildNSFWLevel,
  GuildVerificationLevel,
  PresenceUpdateStatus,
  Role,
} from 'discord.js';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';
import i18next from 'i18next';

export default new Command({
  module: ModuleType.Utilities,
  data: {
    name: 'serverinfo',
    description: 'Get information about the server',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.Guild],
    integration_types: [IntegrationTypes.GuildInstall],
    options: [
      {
        name: 'ephemeral',
        description: 'When set to false will show the message to everyone',
        type: ApplicationCommandOptionType.Boolean,
      },
    ],
  },
  async execute({ interaction, client }) {
    if (!interaction.isChatInputCommand() || !interaction.inCachedGuild()) return;
    const lng = await client.getUserLanguage(interaction.user.id);
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const guild = await interaction.guild.fetch();
    const { channels, emojis, roles, stickers, members, memberCount } = guild;

    const sortedRoles = roles.cache
      .toJSON()
      .slice(1, roles.cache.size)
      .sort((a, b) => b.position - a.position);
    const userRoles = sortedRoles.filter((role) => !role.managed);
    const managedRoles = sortedRoles.filter((role) => role.managed);
    function maxDisplayRoles(roles: Role[]) {
      const results: string[] = [];
      let totalLength = 0;
      for (const role of roles) {
        const roleString = `<@&${role.id}> `;
        if (roleString.length + totalLength > 1000) break;
        results.push(roleString);
      }
      return results;
    }

    const totalMembers = memberCount;
    const humanMembers = members.cache.filter((mem) => !mem.user.bot).size;
    const botMembers = members.cache.filter((mem) => mem.user.bot).size;
    const onlineMembers = members.cache.filter((mem) => mem.presence?.status === PresenceUpdateStatus.Online).size;

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
      .setColor(Colors.Aqua)
      .setThumbnail(guild.iconURL({ size: 4096 }))
      .setTitle(i18next.t('serverinfo.title', { lng }))
      .setImage(guild.bannerURL({ size: 4096 }))
      .addFields(
        {
          name: i18next.t('serverinfo.server.title', { lng }),
          value: [
            i18next.t('serverinfo.server.name', { lng, name: `${guild.name} (${guild.id})` }),
            i18next.t('serverinfo.server.created', { lng, created: `<t:${Math.floor(guild.createdTimestamp / 1000)}:f>` }),
            i18next.t('serverinfo.server.owner', { lng, owner: `<@${guild.ownerId}>` }),
            i18next.t('serverinfo.server.vanity', { lng, vanity: guild.vanityURLCode ?? '/' }),
          ].join('\n'),
          inline: true,
        },
        {
          name: i18next.t('serverinfo.security.title', { lng }),
          value: [
            i18next.t('serverinfo.security.explicit_filter', { lng, filter: GuildExplicitContentFilter[guild.explicitContentFilter] }),
            i18next.t('serverinfo.security.nsfw_level', { lng, level: GuildNSFWLevel[guild.nsfwLevel] }),
            i18next.t('serverinfo.security.verification_level', { lng, level: GuildVerificationLevel[guild.verificationLevel] }),
          ].join('\n'),
          inline: true,
        },
        {
          name: i18next.t('serverinfo.boost.title', { lng }),
          value: [
            i18next.t('serverinfo.boost.tier', { lng, tier: guild.premiumTier }),
            i18next.t('serverinfo.boost.count', { lng, boosts: guild.premiumSubscriptionCount }),
            i18next.t('serverinfo.boost.users', { lng, boosters: members.cache.filter((member) => member.premiumSinceTimestamp).size }),
          ].join('\n'),
          inline: true,
        },
        {
          name: i18next.t('serverinfo.members.title', { lng }),
          value: [
            i18next.t('serverinfo.members.total', { lng, total: totalMembers }),
            i18next.t('serverinfo.members.humans', { lng, humans: humanMembers }),
            i18next.t('serverinfo.members.bots', { lng, bots: botMembers }),
            i18next.t('serverinfo.members.online', { lng, online: onlineMembers }),
          ].join('\n'),
          inline: true,
        },
        {
          name: i18next.t('serverinfo.channels.title', { lng }),
          value: [
            i18next.t('serverinfo.channels.total', { lng, total: totalChannels }),
            i18next.t('serverinfo.channels.categories', { lng, categories: categoryChannels }),
            i18next.t('serverinfo.channels.text', { lng, text: textChannels }),
            i18next.t('serverinfo.channels.voice', { lng, voice: voiceChannels }),
            i18next.t('serverinfo.channels.threads', { lng, threads: threadChannels }),
            i18next.t('serverinfo.channels.other', { lng, other: otherChannels }),
          ].join('\n'),
          inline: true,
        }
      );
    if (guild.description) serverEmbed.setDescription(guild.description);
    if (totalEmojis)
      serverEmbed.addFields({
        name: i18next.t('serverinfo.emojis.title'),
        value: [
          i18next.t('serverinfo.emojis.total', { lng, total: totalEmojis }),
          i18next.t('serverinfo.emojis.animated', { lng, animated: animatedEmojis }),
          i18next.t('serverinfo.emojis.static', { lng, static: staticEmojis }),
          i18next.t('serverinfo.emojis.stickers', { lng, total: totalStickers }),
        ].join('\n'),
        inline: true,
      });
    if (guild.features.length)
      serverEmbed.addFields({
        name: i18next.t('serverinfo.features', { lng }),
        value: guild.features.map((feature) => `\`${feature.toLowerCase().replace(/_/g, ' ')}\``).join(' '),
      });
    const displayUserRoles = maxDisplayRoles(userRoles);
    if (userRoles.length)
      serverEmbed.addFields({
        name: i18next.t('serverinfo.user_roles', { lng, showing: displayUserRoles.length, total: userRoles.length }),
        value: displayUserRoles.join(''),
      });
    const displayManagedRoles = maxDisplayRoles(managedRoles);
    if (managedRoles.length)
      serverEmbed.addFields({
        name: i18next.t('serverinfo.managed_roles', { lng, showing: displayManagedRoles.length, total: managedRoles.length }),
        value: displayManagedRoles.join(''),
      });
    if (guild.banner) serverEmbed.addFields({ name: i18next.t('serverinfo.banner', { lng }), value: '** **' });

    await interaction.editReply({
      embeds: [serverEmbed],
    });
  },
});

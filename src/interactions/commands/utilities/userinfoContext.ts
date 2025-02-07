import {
  ActivityType,
  ApplicationCommandType,
  ApplicationIntegrationType,
  ContextMenuCommandBuilder,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  Role,
  roleMention,
  time,
  TimestampStyles
} from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { logger } from 'utils/logger';

import { ModuleType } from 'types/interactions';

const commandType = ApplicationCommandType.User;

export default new Command<typeof commandType>({
  module: ModuleType.Utilities,
  data: new ContextMenuCommandBuilder()
    .setName('userinfo-context')
    .setType(commandType)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
  async execute({ interaction, client, lng }) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const user = await client.users
      .fetch(interaction.options.getUser('user', false)?.id ?? interaction.user.id, {
        force: true
      })
      .catch((err) => logger.debug({ err }, 'Could not fetch user'));
    if (!user) return interaction.editReply({ content: t('userinfo.user', { lng }) });

    const member = await interaction.guild?.members.fetch(user.id).catch((err) => logger.debug({ err, userId: user.id }, 'Could not fetch member'));

    const badges = user.flags?.toArray() ?? [];
    const badgeMap = {
      Staff: client.customEmojis.discord_employee, // Discord Employee
      Partner: client.customEmojis.discord_partner, // Partnered Server Owner
      Hypesquad: client.customEmojis.hypesquad, // HypeSquad Events Member
      BugHunterLevel1: client.customEmojis.bughunter, // Bug Hunter Level 1
      MFASMS: 'MFASMS', // @unstable This user flag is currently not documented by Discord but has a known value
      PremiumPromoDismissed: 'PremiumPromoDismissed', // @unstable This user flag is currently not documented by Discord but has a known value
      HypeSquadOnlineHouse1: client.customEmojis.bravery, // House Bravery Member
      HypeSquadOnlineHouse2: client.customEmojis.brilliance, // House Brilliance Member
      HypeSquadOnlineHouse3: client.customEmojis.balance, // House Balance Member
      PremiumEarlySupporter: client.customEmojis.early_supporter, // Early Nitro Supporter
      TeamPseudoUser: 'TeamPseudoUser', // User is a [team](https://discord.com/developers/docs/topics/teams)
      HasUnreadUrgentMessages: 'HasUnreadUrgentMessages', // @unstable This user flag is currently not documented by Discord but has a known value
      BugHunterLevel2: client.customEmojis.bughunter_two, // Bug Hunter Level 2
      VerifiedBot: `${client.customEmojis.verified_app_one}${client.customEmojis.verified_app_two}${client.customEmojis.verified_app_three}`, // Verified Bot
      VerifiedDeveloper: client.customEmojis.verified_bot_developer, // Early Verified Bot Developer
      CertifiedModerator: client.customEmojis.alumni, // Moderator Programs Alumni
      BotHTTPInteractions: client.customEmojis.bot_http_interactions, // Bot uses only [HTTP interactions](https://discord.com/developers/docs/interactions/receiving-and-responding#receiving-an-interaction) and is shown in the online member list
      Spammer: 'Spammer', // User has been identified as spammer @unstable This user flag is currently not documented by Discord but has a known value
      DisablePremium: 'DisablePremium', // @unstable This user flag is currently not documented by Discord but has a known value
      ActiveDeveloper: client.customEmojis.active_developer, // User is an [Active Developer](https://support-dev.discord.com/hc/articles/10113997751447)
      Quarantined: 'Quarantined', // User's account has been [quarantined](https://support.discord.com/hc/articles/6461420677527) based on recent activity @unstable This user flag is currently not documented by Discord but has a known value. This value would be 1 << 44, but bit shifting above 1 << 30 requires bigints
      Collaborator: 'Collaborator', // @unstable This user flag is currently not documented by Discord but has a known value. This value would be 1 << 50, but bit shifting above 1 << 30 requires bigints
      RestrictedCollaborator: 'RestrictedCollaborator', // @unstable This user flag is currently not documented by Discord but has a known value. This value would be 1 << 51, but bit shifting above 1 << 30 requires bigints
      App: `${client.customEmojis.app_one}${client.customEmojis.app_two}`
    };

    const userEmbed = new EmbedBuilder()
      .setColor(user.accentColor ?? client.colors.utilities)
      .setThumbnail(user.displayAvatarURL({ size: 4096, extension: 'webp' }))
      .addFields(
        {
          name: t('userinfo.user-title', { lng }),
          value: [`${user} | ${user.username}`, user.id].join('\n')
        },
        {
          name: t('userinfo.created-at', { lng }),
          value: `${time(Math.floor(user.createdTimestamp / 1000), TimestampStyles.ShortDate)} | ${time(Math.floor(user.createdTimestamp / 1000), TimestampStyles.RelativeTime)}`
        }
      );

    if (badges.length || user.bot) {
      userEmbed.addFields({
        name: t('userinfo.badges', { lng }),
        value:
          !badges.includes('VerifiedBot') && user.bot ? [badgeMap.App, ...badges.map((v) => badgeMap[v])].join(' ') : badges.map((v) => badgeMap[v]).join(' ')
      });
    }

    if (user.banner) {
      userEmbed.addFields({ name: t('userinfo.banner', { lng }), value: '** **' }).setImage(user.bannerURL({ size: 4096, extension: 'webp' }) ?? null);
    }

    if (!member) return interaction.editReply({ embeds: [userEmbed] });

    const activities = [
      t('userinfo.activity.playing', { lng }),
      t('userinfo.activity.streaming', { lng }),
      t('userinfo.activity.listening', { lng }),
      t('userinfo.activity.watching', { lng }),
      t('userinfo.activity.custom', { lng }),
      t('userinfo.activity.competing', { lng })
    ];
    const status = {
      online: t('userinfo.status.online', { lng }),
      idle: t('userinfo.status.idle', { lng }),
      dnd: t('userinfo.status.dnd', { lng }),
      offline: t('userinfo.status.offline', { lng }),
      invisible: t('userinfo.status.invisible', { lng })
    };
    const statusImage = {
      idle: 'https://i.ibb.co/tB36GNW/undefined-Imgur.png',
      dnd: 'https://i.ibb.co/SPqGC4P/undefined-Imgur-1.png',
      online: 'https://i.ibb.co/pnnTZhK/undefined-Imgur-2.png',
      offline: 'https://i.ibb.co/bQDDfBw/undefined-Imgur-3.png',
      invisible: 'https://i.ibb.co/bQDDfBw/undefined-Imgur-3.png'
    };

    const devices = Object.entries(member.presence?.clientStatus ?? {}).map(([key]) => `${key}`);

    function maxDisplayRoles(roles: Role[]) {
      const results: string[] = [];
      let totalLength = 0;
      for (const role of roles) {
        const roleString = roleMention(role.id) + ' ';
        if (roleString.length + totalLength > 1000) break;
        results.push(roleString);
        totalLength += roleString.length;
      }
      return results;
    }

    const roles = member.roles.cache
      .map((r) => r)
      .sort((a, b) => b.position - a.position)
      .slice(0, member.roles.cache.size - 1);

    const memberEmbed = new EmbedBuilder()
      .setColor(member.displayColor ?? client.colors.utilities)
      .setAuthor({ name: status[member.presence?.status ?? 'offline'], iconURL: statusImage[member.presence?.status ?? 'offline'] })
      .setThumbnail(member.avatarURL({ size: 4096, extension: 'webp' }))
      .addFields({
        name: t('userinfo.joined-at', { lng }),
        value: `${time(Math.floor((member.joinedTimestamp ?? 0) / 1000), TimestampStyles.ShortDate)} | ${time(Math.floor((member.joinedTimestamp ?? 0) / 1000), TimestampStyles.RelativeTime)}`
      });

    if (member.presence?.activities?.length) {
      memberEmbed.addFields({
        name: t('userinfo.activities', { lng }),
        value: member.presence.activities
          .map((activity) => {
            if (activity.type === ActivityType.Custom) {
              return activity.name;
            }
            return `${activities[activity.type]} ${activity.name}`;
          })
          .join('\n')
      });
    }

    if (devices?.length) {
      memberEmbed.addFields({
        name: t('userinfo.devices', { lng }),
        value: devices.join(', ')
      });
    }

    if (member.premiumSinceTimestamp) {
      memberEmbed.addFields({
        name: t('userinfo.boosting', { lng }),
        value: `${time(Math.floor(member.premiumSinceTimestamp / 1000), TimestampStyles.ShortDate)} | ${time(Math.floor(member.premiumSinceTimestamp / 1000), TimestampStyles.RelativeTime)}`
      });
    }

    if (roles.length) {
      const displayRoles = maxDisplayRoles(roles);
      memberEmbed.addFields({
        name: t('userinfo.roles', {
          lng,
          showing: roles.length,
          total: displayRoles.length
        }),
        value: displayRoles.join('')
      });
    }

    return interaction.editReply({ embeds: [userEmbed, memberEmbed] }).catch((err) => logger.debug(err, 'Could not edit reply'));
  }
});

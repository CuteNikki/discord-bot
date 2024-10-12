import {
  ApplicationIntegrationType,
  channelMention,
  EmbedBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  roleMention,
  SlashCommandBuilder
} from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import {
  addExp,
  addLevel,
  addLevelEnabledChannel,
  addLevelIgnoredChannel,
  addLevelIgnoredRole,
  addLevelMultiplier,
  addLevelReward,
  disableLevel,
  enableLevel,
  getLevel,
  getLevelConfig,
  getRewardsForLevel,
  removeLevelEnabledChannel,
  removeLevelIgnoredChannel,
  removeLevelIgnoredRole,
  removeLevelMultiplier,
  removeLevelReward,
  setExp,
  setLevel,
  updateLevelAnnouncement
} from 'db/level';

import { logger } from 'utils/logger';

import { MAX_ENABLED_CHANNELS, MAX_IGNORED_CHANNELS, MAX_IGNORED_ROLES, MAX_MULTIPLIER, MAX_MULTIPLIERS, MAX_REWARDS } from 'constants/level';

import { ModuleType } from 'types/interactions';
import { AnnouncementType, type LevelReward, type Multiplier } from 'types/level';

export default new Command({
  module: ModuleType.Config,
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('Configure the level module')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .addSubcommandGroup((group) =>
      group
        .setName('xp')
        .setDescription('Manage the XP of a member')
        .addSubcommand((cmd) =>
          cmd
            .setName('add')
            .setDescription('Adds XP to a member')
            .addUserOption((option) => option.setName('member').setDescription('The member to add XP to').setRequired(true))
            .addIntegerOption((option) => option.setName('xp').setDescription('The XP to add to member').setRequired(true).setMinValue(0))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('remove')
            .setDescription('Removes XP from a member')
            .addUserOption((option) => option.setName('member').setDescription('The member to remove XP from').setRequired(true))
            .addIntegerOption((option) => option.setName('xp').setDescription('The XP to remove from member').setRequired(true).setMinValue(0))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('set')
            .setDescription('Sets the XP of a member')
            .addUserOption((option) => option.setName('member').setDescription('The member to set XP of').setRequired(true))
            .addIntegerOption((option) => option.setName('xp').setDescription('The XP to set the member to').setRequired(true).setMinValue(0))
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('level')
        .setDescription('Manage the level of a member')
        .addSubcommand((cmd) =>
          cmd
            .setName('add')
            .setDescription('Adds level to a member')
            .addUserOption((option) => option.setName('member').setDescription('The member to add level to').setRequired(true))
            .addIntegerOption((option) => option.setName('level').setDescription('The level to add to member').setRequired(true).setMinValue(1))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('remove')
            .setDescription('Removes level from a member')
            .addUserOption((option) => option.setName('member').setDescription('The member to remove level from').setRequired(true))
            .addIntegerOption((option) => option.setName('level').setDescription('The level to remove from member').setRequired(true).setMinValue(1))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('set')
            .setDescription('Sets the level of a member')
            .addUserOption((option) => option.setName('member').setDescription('The member to set level of').setRequired(true))
            .addIntegerOption((option) => option.setName('level').setDescription('The level to set the member to').setRequired(true).setMinValue(1))
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('announcement')
        .setDescription('Configure where a levelup will be announced')
        .addSubcommand((cmd) => cmd.setName('none').setDescription('Level ups will not be announced'))
        .addSubcommand((cmd) => cmd.setName('private-message').setDescription("Announces in the user's private messages"))
        .addSubcommand((cmd) => cmd.setName('user-channel').setDescription('Announces in the same channel as the user and deletes the message after 5 seconds'))
        .addSubcommand((cmd) =>
          cmd
            .setName('other-channel')
            .setDescription('Announces in a specified channel')
            .addChannelOption((option) => option.setName('channel').setDescription('The channel to send levelup announcements in').setRequired(true))
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('enabled-channels')
        .setDescription('Configure the enabled channels')
        .addSubcommand((cmd) =>
          cmd
            .setName('add')
            .setDescription('Adds an enabled channel')
            .addChannelOption((option) => option.setName('channel').setDescription('The channel to add').setRequired(true))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('remove')
            .setDescription('Removes an enabled channel')
            .addChannelOption((option) => option.setName('channel').setDescription('The channel to remove').setRequired(false))
            .addStringOption((option) => option.setName('channel-id').setDescription('The id of channel to remove').setRequired(false))
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('ignored-channels')
        .setDescription('Configure the ignored channels')
        .addSubcommand((cmd) =>
          cmd
            .setName('add')
            .setDescription('Adds an ignored channel')
            .addChannelOption((option) => option.setName('channel').setDescription('The channel to ignore').setRequired(true))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('remove')
            .setDescription('Removes an ignored channel')
            .addChannelOption((option) => option.setName('channel').setDescription('The channel to remove').setRequired(false))
            .addStringOption((option) => option.setName('channel-id').setDescription('The id of channel to remove').setRequired(false))
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('ignored-roles')
        .setDescription('Configure the ignored roles')
        .addSubcommand((cmd) =>
          cmd
            .setName('add')
            .setDescription('Adds an ignored role')
            .addRoleOption((option) => option.setName('role').setDescription('The role to ignore').setRequired(true))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('remove')
            .setDescription('Removes an ignored role')
            .addRoleOption((option) => option.setName('role').setDescription('The role to remove').setRequired(false))
            .addStringOption((option) => option.setName('role-id').setDescription('The id of role to remove').setRequired(false))
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('rewards')
        .setDescription('Configure the level up rewards')
        .addSubcommand((cmd) =>
          cmd
            .setName('add')
            .setDescription('Adds a level up reward')
            .addRoleOption((option) => option.setName('role').setDescription('The role to give').setRequired(true))
            .addIntegerOption((option) =>
              option.setName('level').setDescription('The level required to get role').setMinValue(1).setMaxValue(1000).setRequired(true)
            )
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('remove')
            .setDescription('Removes a level up reward')
            .addRoleOption((option) => option.setName('role').setDescription('The role to remove').setRequired(false))
            .addStringOption((option) => option.setName('role-id').setDescription('The id of role to remove').setRequired(false))
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('multipliers')
        .setDescription('Configure the level up multipliers')
        .addSubcommand((cmd) =>
          cmd
            .setName('add')
            .setDescription('Adds a level up multiplier')
            .addRoleOption((option) => option.setName('role').setDescription('The role that will have the multiplier').setRequired(true))
            .addNumberOption((option) =>
              option.setName('multiplier').setDescription('The multiplier to apply').setMaxValue(MAX_MULTIPLIER).setMinValue(0).setRequired(true)
            )
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('remove')
            .setDescription('Removes a level up multiplier')
            .addRoleOption((option) => option.setName('role').setDescription('The role to remove').setRequired(false))
            .addStringOption((option) => option.setName('role-id').setDescription('The id of role to remove').setRequired(false))
        )
    )
    .addSubcommand((cmd) => cmd.setName('info').setDescription('Shows the current configuration'))
    .addSubcommand((cmd) => cmd.setName('enable').setDescription('Enable the level module'))
    .addSubcommand((cmd) => cmd.setName('disable').setDescription('Disable the level module')),
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const { options, guild } = interaction;

    const level = (await getLevelConfig(guild.id)) ?? {
      enabled: false,
      ignoredChannels: [] as string[],
      ignoredRoles: [] as string[],
      enabledChannels: [] as string[],
      rewards: [] as LevelReward[],
      multipliers: [] as Multiplier[],
      announcement: AnnouncementType.UserChannel,
      channelId: undefined
    };

    if (options.getSubcommand() === 'info') {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.colors.level)
            .setTitle(t('level.title', { lng }))
            .addFields(
              {
                name: t('level.state.title', { lng }),
                value: level.enabled ? t('enabled', { lng }) : t('disabled', { lng })
              },
              {
                name: t('level.announcement.title', { lng }),
                value:
                  level.announcement === AnnouncementType.None
                    ? t('level.announcement.none', { lng })
                    : level.announcement === AnnouncementType.UserChannel
                      ? t('level.announcement.user', { lng })
                      : level.announcement === AnnouncementType.PrivateMessage
                        ? t('level.announcement.private', { lng })
                        : t('level.announcement.other', { lng, channel: channelMention(level.channelId!) })
              },
              {
                name: t('level.ignored-roles.title', { lng }),
                value: level.ignoredRoles.length
                  ? level.ignoredRoles
                      .map((id) => {
                        const role = guild.roles.cache.get(id);
                        return role ? role.toString() : id;
                      })
                      .join('\n')
                  : t('none', { lng })
              },
              {
                name: t('level.ignored-channels.title', { lng }),
                value: level.ignoredChannels.length
                  ? level.ignoredChannels
                      .map((id) => {
                        const channel = guild.channels.cache.get(id);
                        return channel ? channel.toString() : id;
                      })
                      .join('\n')
                  : t('none', { lng })
              },
              {
                name: t('level.enabled-channels.title', { lng }),
                value: level.enabledChannels.length
                  ? level.enabledChannels
                      .map((id) => {
                        const channel = guild.channels.cache.get(id);
                        return channel ? channel.toString() : id;
                      })
                      .join('\n')
                  : t('none', { lng })
              },
              {
                name: t('level.rewards.title', { lng }),
                value: level.rewards.length
                  ? level.rewards
                      .map(({ level, roleId }) => {
                        const role = guild.roles.cache.get(roleId);
                        return role ? `${level}: ${role.toString()}` : `${level}: ${roleId}`;
                      })
                      .join('\n')
                  : t('none', { lng })
              },
              {
                name: t('level.multipliers.title', { lng }),
                value: level.multipliers.length
                  ? level.multipliers
                      .map(({ roleId, multiplier }) => {
                        const role = guild.roles.cache.get(roleId);
                        return role ? `${role.toString()}: ${multiplier}x` : `${roleId}: ${multiplier}x`;
                      })
                      .join('\n')
                  : t('none', { lng })
              }
            )
        ]
      });
    }

    if (options.getSubcommand() === 'enable') {
      if (level.enabled) {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.state.already-enabled', { lng }))]
        });
        return;
      }

      await enableLevel(guild.id);

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.state.enabled', { lng }))]
      });
      return;
    }

    if (options.getSubcommand() === 'disable') {
      if (!level.enabled) {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.state.already-disabled', { lng }))]
        });
        return;
      }

      await disableLevel(guild.id);

      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.state.disabled', { lng }))]
      });
      return;
    }

    if (options.getSubcommandGroup() === 'xp') {
      if (options.getSubcommand() === 'add') {
        const user = options.getUser('member', true);
        const xp = options.getInteger('xp', true);

        if (user.bot) {
          await interaction.editReply(t('level.bot', { lng }));
          return;
        }

        const member = guild.members.cache.get(user.id);

        const userLevel = await addExp(user.id, guild.id, xp);
        const rewards = await getRewardsForLevel(userLevel);

        if (member && rewards.length) {
          await member.roles.add(rewards.map((reward) => reward.roleId)).catch((err) => logger.debug({ err, userId: user.id }, 'Could not add role(s)'));
        }

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.level)
              .setDescription(t('level.xp.added', { lng, xp, user: user.toString(), newXP: userLevel.xp, newLevel: userLevel.level }))
          ]
        });
      }

      if (options.getSubcommand() === 'remove') {
        const user = options.getUser('member', true);
        const xp = options.getInteger('xp', true);

        if (user.bot) {
          await interaction.editReply(t('level.bot', { lng }));
          return;
        }

        const member = guild.members.cache.get(user.id);

        const currentLevel = await getLevel(user.id, guild.id, true);
        const updatedLevel = await addExp(user.id, guild.id, -xp);

        const oldRewards = await getRewardsForLevel(currentLevel);
        const newRewards = await getRewardsForLevel(updatedLevel);

        if (member && (oldRewards.length || newRewards.length)) {
          await member.roles
            .set([
              ...member.roles.cache.map((role) => role.id).filter((id) => !oldRewards.map((reward) => reward.roleId).includes(id)),
              ...newRewards.map((reward) => reward.roleId)
            ])
            .catch((err) => logger.debug({ err, userId: user.id }, 'Could not set role(s)'));
        }

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.level)
              .setDescription(t('level.xp.removed', { lng, xp, user: user.toString(), newXP: updatedLevel.xp, newLevel: updatedLevel.level }))
          ]
        });
      }

      if (options.getSubcommand() === 'set') {
        const user = options.getUser('member', true);
        const xp = options.getInteger('xp', true);

        if (user.bot) {
          await interaction.editReply(t('level.bot', { lng }));
          return;
        }

        const member = guild.members.cache.get(user.id);

        const userLevel = await setExp(user.id, guild.id, xp);
        const rewards = await getRewardsForLevel(userLevel);

        if (member && rewards.length) {
          await member.roles.add(rewards.map((reward) => reward.roleId)).catch((err) => logger.debug({ err, userId: user.id }, 'Could not add role(s)'));
        }

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.level)
              .setDescription(t('level.xp.set', { lng, xp, user: user.toString(), newXP: userLevel.xp, newLevel: userLevel.level }))
          ]
        });
      }
    }

    if (options.getSubcommandGroup() === 'level') {
      if (options.getSubcommand() === 'add') {
        const user = options.getUser('member', true);
        const level = options.getInteger('level', true);

        if (user.bot) {
          await interaction.editReply(t('level.bot', { lng }));
          return;
        }

        const member = guild.members.cache.get(user.id);

        const userLevel = await addLevel(user.id, guild.id, level);
        const rewards = await getRewardsForLevel(userLevel);

        if (member && rewards.length) {
          await member.roles.add(rewards.map((reward) => reward.roleId)).catch((err) => logger.debug({ err, userId: user.id }, 'Could not add role(s)'));
        }

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.level)
              .setDescription(t('level.level.added', { lng, level, user: user.toString(), newXP: userLevel.xp, newLevel: userLevel.level }))
          ]
        });
      }

      if (options.getSubcommand() === 'remove') {
        const user = options.getUser('member', true);
        const level = options.getInteger('level', true);

        if (user.bot) {
          await interaction.editReply(t('level.bot', { lng }));
          return;
        }

        const member = guild.members.cache.get(user.id);

        const currentLevel = await getLevel(user.id, guild.id, true);
        const updatedLevel = await addLevel(user.id, guild.id, -level);

        const oldRewards = await getRewardsForLevel(currentLevel);
        const newRewards = await getRewardsForLevel(updatedLevel);

        if (member && (oldRewards.length || newRewards.length)) {
          await member.roles
            .set([
              ...member.roles.cache.map((role) => role.id).filter((id) => !oldRewards.map((reward) => reward.roleId).includes(id)),
              ...newRewards.map((reward) => reward.roleId)
            ])
            .catch((err) => logger.debug({ err, userId: user.id }, 'Could not set role(s)'));
        }

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.rewards.removed', { lng }))]
        });
      }

      if (options.getSubcommand() === 'set') {
        const user = options.getUser('member', true);
        const level = options.getInteger('level', true);

        if (user.bot) {
          await interaction.editReply(t('level.bot', { lng }));
          return;
        }

        const member = guild.members.cache.get(user.id);

        const userLevel = await setLevel(user.id, guild.id, level);
        const rewards = await getRewardsForLevel(userLevel);

        if (member && rewards.length) {
          await member.roles.add(rewards.map((reward) => reward.roleId)).catch((err) => logger.debug({ err, userId: user.id }, 'Could not add role(s)'));
        }

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.level)
              .setDescription(t('level.level.set', { lng, level, user: user.toString(), newXP: userLevel.xp, newLevel: userLevel.level }))
          ]
        });
      }
    }

    if (options.getSubcommandGroup() === 'announcement') {
      if (options.getSubcommand() === 'none') {
        if (level.announcement === AnnouncementType.None) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.announcement.already-none', { lng }))]
          });
          return;
        }

        await updateLevelAnnouncement(guild.id, AnnouncementType.None);

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.announcement.none', { lng }))]
        });
        return;
      }

      if (options.getSubcommand() === 'private-message') {
        if (level.announcement === AnnouncementType.PrivateMessage) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.announcement.already-private', { lng }))]
          });
          return;
        }

        await updateLevelAnnouncement(guild.id, AnnouncementType.PrivateMessage);

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.announcement.private', { lng }))]
        });
        return;
      }

      if (options.getSubcommand() === 'user-channel') {
        if (level.announcement === AnnouncementType.UserChannel) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.announcement.already-user', { lng }))]
          });
          return;
        }

        await updateLevelAnnouncement(guild.id, AnnouncementType.UserChannel);

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.announcement.user', { lng }))]
        });
        return;
      }

      if (options.getSubcommand() === 'other-channel') {
        const channel = options.getChannel('channel', true);

        if (level.channelId === channel.id) {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.announcement.already-channel', { lng, channel: channel.toString() }))
            ]
          });
          return;
        }

        await updateLevelAnnouncement(guild.id, AnnouncementType.OtherChannel, channel.id);

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.announcement.other', { lng, channel: channel.toString() }))]
        });
      }
    }

    if (options.getSubcommandGroup() === 'enabled-channels') {
      if (options.getSubcommand() === 'add') {
        const channel = options.getChannel('channel', true);

        if (level.enabledChannels.includes(channel.id)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.enabled-channels.already', { lng, channel: channel.toString() }))]
          });
          return;
        }

        if (level.enabledChannels.length >= MAX_ENABLED_CHANNELS) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.enabled-channels.limit', { lng, max: MAX_ENABLED_CHANNELS }))]
          });
          return;
        }

        await addLevelEnabledChannel(guild.id, channel.id);

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.enabled-channels.added', { lng, channel: channel.toString() }))]
        });
      }

      if (options.getSubcommand() === 'remove') {
        const channelId = options.getString('channel-id', false);
        const channel = options.getChannel('channel', false);

        if (!channelId && !channel) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.enabled-channels.none', { lng }))]
          });
          return;
        }

        if ((channelId && !level.enabledChannels.includes(channelId)) || (channel && !level.enabledChannels.includes(channel.id))) {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.error)
                .setDescription(t('level.enabled-channels.invalid', { lng, channel: channelId ? channelMention(channelId) : channel!.toString() }))
            ]
          });
          return;
        }

        await removeLevelEnabledChannel(guild.id, (channelId ?? channel?.id)!);

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.level)
              .setDescription(t('level.enabled-channels.removed', { lng, channel: channelId ? channelMention(channelId) : channel!.toString() }))
          ]
        });
      }
    }

    if (options.getSubcommandGroup() === 'ignored-channels') {
      if (options.getSubcommand() === 'add') {
        const channel = options.getChannel('channel', true);

        if (level.ignoredChannels.includes(channel.id)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.ignored-channels.already', { lng, channel: channel.toString() }))]
          });
          return;
        }

        if (level.ignoredChannels.length >= MAX_IGNORED_CHANNELS) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.ignored-channels.limit', { lng, max: MAX_IGNORED_CHANNELS }))]
          });
          return;
        }

        await addLevelIgnoredChannel(guild.id, channel.id);

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.ignored-channels.added', { lng, channel: channel.toString() }))]
        });
      }

      if (options.getSubcommand() === 'remove') {
        const channelId = options.getString('channel-id', false);
        const channel = options.getChannel('channel', false);

        if (!channelId && !channel) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.ignored-channels.none', { lng }))]
          });
          return;
        }

        if ((channelId && !level.ignoredChannels.includes(channelId)) || (channel && !level.ignoredChannels.includes(channel.id))) {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.error)
                .setDescription(t('level.ignored-channels.invalid', { lng, channel: channelId ? channelMention(channelId) : channel!.toString() }))
            ]
          });
          return;
        }

        await removeLevelIgnoredChannel(guild.id, (channelId ?? channel?.id)!);

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.level)
              .setDescription(t('level.ignored-channels.removed', { lng, channel: channelId ? channelMention(channelId) : channel!.toString() }))
          ]
        });
      }
    }

    if (options.getSubcommandGroup() === 'ignored-roles') {
      if (options.getSubcommand() === 'add') {
        const role = options.getRole('role', true);

        if (level.ignoredRoles.includes(role.id)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.ignored-roles.already', { lng, role: role.toString() }))]
          });
          return;
        }

        if (level.ignoredRoles.length >= MAX_IGNORED_ROLES) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.ignored-roles.limit', { lng, max: MAX_IGNORED_ROLES }))]
          });
          return;
        }

        await addLevelIgnoredRole(guild.id, role.id);

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.ignored-roles.added', { lng, role: role.toString() }))]
        });
      }

      if (options.getSubcommand() === 'remove') {
        const roleId = options.getString('role-id', false);
        const role = options.getRole('role', false);

        if (!roleId && !role) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.ignored-roles.none', { lng }))]
          });
          return;
        }

        if ((roleId && !level.ignoredRoles.includes(roleId)) || (role && !level.ignoredRoles.includes(role.id))) {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.error)
                .setDescription(t('level.ignored-roles.invalid', { lng, role: roleId ? roleMention(roleId) : role!.toString() }))
            ]
          });
          return;
        }

        await removeLevelIgnoredRole(guild.id, (roleId ?? role?.id)!);

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.level)
              .setDescription(t('level.ignored-roles.removed', { lng, role: roleId ? roleMention(roleId) : role!.toString() }))
          ]
        });
      }
    }

    if (options.getSubcommandGroup() === 'multipliers') {
      if (options.getSubcommand() === 'add') {
        const role = options.getRole('role', true);
        const multiplier = options.getNumber('multiplier', true);

        if (multiplier < 0 || multiplier > MAX_MULTIPLIER) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.multipliers.invalid-multiplier', { lng, max: MAX_MULTIPLIER }))]
          });
          return;
        }

        if (level.multipliers.length >= MAX_MULTIPLIERS) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.multipliers.limit', { lng, max: MAX_MULTIPLIERS }))]
          });
          return;
        }

        const currentRoles = level.multipliers.map((multiplier) => multiplier.roleId);

        if (currentRoles.includes(role.id)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.multipliers.already', { lng, role: role.toString() }))]
          });
          return;
        }

        await addLevelMultiplier(guild.id, role.id, multiplier);

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.multipliers.added', { lng, role: role.toString(), multiplier }))]
        });
      }

      if (options.getSubcommand() === 'remove') {
        const roleId = options.getString('role-id', false);
        const role = options.getRole('role', false);

        if (!roleId && !role) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.multipliers.none', { lng }))]
          });
          return;
        }

        const currentRoles = level.multipliers.map((multiplier) => multiplier.roleId);

        if ((roleId && !currentRoles.includes(roleId)) || (role && !currentRoles.includes(role.id))) {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.error)
                .setDescription(t('level.multipliers.invalid', { lng, role: roleId ? roleMention(roleId) : role!.toString() }))
            ]
          });
          return;
        }

        await removeLevelMultiplier(guild.id, (roleId ?? role?.id)!);

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.level)
              .setDescription(t('level.multipliers.removed', { lng, role: roleId ? roleMention(roleId) : role!.toString() }))
          ]
        });
      }
    }

    if (options.getSubcommandGroup() === 'rewards') {
      if (options.getSubcommand() === 'add') {
        const role = options.getRole('role', true);
        const lvl = options.getInteger('level', true);

        if (lvl < 1 || lvl > 1000) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.rewards.invalid-level', { lng }))]
          });
          return;
        }

        if (level.rewards.length >= MAX_REWARDS) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.rewards.limit', { lng, max: MAX_REWARDS }))]
          });
          return;
        }

        const currentRoles = level.rewards.map((reward) => reward.roleId);

        if (currentRoles.includes(role.id)) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.rewards.already', { lng, role: role.toString() }))]
          });
          return;
        }

        await addLevelReward(guild.id, lvl, role.id);

        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.rewards.added', { lng, level: lvl, role: role.toString() }))]
        });
      }

      if (options.getSubcommand() === 'remove') {
        const roleId = options.getString('role-id', false);
        const role = options.getRole('role', false);

        if (!roleId && !role) {
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.rewards.none', { lng }))]
          });
          return;
        }

        const currentRoles = level.rewards.map((reward) => reward.roleId);

        if ((roleId && !currentRoles.includes(roleId)) || (role && !currentRoles.includes(role.id))) {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.error)
                .setDescription(t('level.rewards.invalid', { lng, role: roleId ? roleMention(roleId) : role!.toString() }))
            ]
          });
          return;
        }

        await removeLevelReward(guild.id, (roleId ?? role?.id)!);

        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.level)
              .setDescription(t('level.rewards.removed', { lng, role: roleId ? roleMention(roleId) : role!.toString() }))
          ]
        });
      }
    }
  }
});

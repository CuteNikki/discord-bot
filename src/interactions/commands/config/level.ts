import { ApplicationIntegrationType, ChannelType, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { getGuildSettings, updateGuildSettings } from 'db/guild';
import { addLevel, addXP, getLevelForce, getRewardsForLevel, setLevel, setXP } from 'db/level';

import { AnnouncementType } from 'types/guild';

import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.Config,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('config-level')
    .setDescription('Configure the level module')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addSubcommandGroup((group) =>
      group
        .setName('show')
        .setDescription('Shows the current configuration')
        .addSubcommand((subcommand) => subcommand.setName('all').setDescription('Shows the entire configuration'))
        .addSubcommand((subcommand) => subcommand.setName('state').setDescription('Shows the level module state'))
        .addSubcommand((subcommand) => subcommand.setName('announcement').setDescription('Shows the announcement configuration'))
        .addSubcommand((subcommand) => subcommand.setName('rewards').setDescription('Shows the level rewards'))
        .addSubcommand((subcommand) => subcommand.setName('ignored-roles').setDescription('Shows the ignored roles'))
        .addSubcommand((subcommand) => subcommand.setName('ignored-channels').setDescription('Shows the ignored channels'))
        .addSubcommand((subcommand) => subcommand.setName('enabled-channels').setDescription('Shows the enabled channels'))
    )
    .addSubcommandGroup((group) =>
      group
        .setName('toggle')
        .setDescription('Toggle the level module')
        .addSubcommand((subcommand) => subcommand.setName('on').setDescription('Turns the level module on'))
        .addSubcommand((subcommand) => subcommand.setName('off').setDescription('Turns the level module off'))
    )
    .addSubcommandGroup((group) =>
      group
        .setName('announcement')
        .setDescription('Configure where a levelup will be announced')
        .addSubcommand((subcommand) => subcommand.setName('user-channel').setDescription('Announces in channel of user and deletes after 5 seconds'))
        .addSubcommand((subcommand) =>
          subcommand
            .setName('other-channel')
            .setDescription('Announces in a specified channel')
            .addChannelOption((option) =>
              option.setName('channel').setDescription('The channel to send levelup announcements in').setRequired(true).addChannelTypes(ChannelType.GuildText)
            )
        )
        .addSubcommand((subcommand) => subcommand.setName('private-message').setDescription('Sends a direct message to the user'))
        .addSubcommand((subcommand) => subcommand.setName('none').setDescription('Level ups will not be announced'))
    )
    .addSubcommandGroup((group) =>
      group
        .setName('rewards')
        .setDescription('Configure the level up rewards')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('add')
            .setDescription('Adds a level up reward')
            .addRoleOption((option) => option.setName('role').setDescription('The role to give').setRequired(true))
            .addIntegerOption((option) => option.setName('level').setDescription('The level required to get role').setRequired(true))
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('remove')
            .setDescription('Removes a level up reward')
            .addStringOption((option) => option.setName('role-id').setDescription('The id of role to remove').setRequired(true))
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('ignored-roles')
        .setDescription('Configure the ignored roles')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('add')
            .setDescription('Adds an ignored role')
            .addRoleOption((option) => option.setName('role').setDescription('The role to ignore').setRequired(true))
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('remove')
            .setDescription('Removes an ignored role')
            .addStringOption((option) => option.setName('role-id').setDescription('The id of role to remove').setRequired(true))
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('ignored-channels')
        .setDescription('Configure the ignored channels')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('add')
            .setDescription('Adds an ignored channel')
            .addChannelOption((option) =>
              option.setName('channel').setDescription('The channel to ignore').setRequired(true).addChannelTypes(ChannelType.GuildText)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('remove')
            .setDescription('Removes an ignored channel')
            .addStringOption((option) => option.setName('channel-id').setDescription('The id of channel to remove').setRequired(true))
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('enabled-channels')
        .setDescription('Configure the channels where levelling is enabled')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('add')
            .setDescription('Adds an enabled channel')
            .addChannelOption((option) =>
              option.setName('channel').setDescription('The channel to add').setRequired(true).addChannelTypes(ChannelType.GuildText)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('remove')
            .setDescription('Removes an enabled channel')
            .addStringOption((option) => option.setName('channel-id').setDescription('The id of channel to remove').setRequired(true))
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('xp')
        .setDescription('Manage the XP of a user')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('add')
            .setDescription('Adds XP to a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to add XP to').setRequired(true))
            .addIntegerOption((option) => option.setName('xp').setDescription('The XP to add to user').setRequired(true).setMaxValue(200000))
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('remove')
            .setDescription('Removes XP from a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to remove XP from').setRequired(true))
            .addIntegerOption((option) => option.setName('xp').setDescription('The XP to remove from user').setRequired(true).setMaxValue(200000))
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('set')
            .setDescription('Sets the XP of a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to set XP of').setRequired(true))
            .addIntegerOption((option) => option.setName('xp').setDescription('The XP to set the user to').setRequired(true).setMaxValue(200000))
        )
    )
    .addSubcommandGroup((group) =>
      group
        .setName('level')
        .setDescription('Manage the level of a user')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('add')
            .setDescription('Adds level to a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to add level to').setRequired(true))
            .addIntegerOption((option) => option.setName('level').setDescription('The level to add to user').setRequired(true).setMaxValue(1000))
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('remove')
            .setDescription('Removes level from a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to remove level from').setRequired(true))
            .addIntegerOption((option) => option.setName('level').setDescription('The level to remove from user').setRequired(true).setMaxValue(1000))
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('set')
            .setDescription('Sets the level of a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to set level of').setRequired(true))
            .addIntegerOption((option) => option.setName('level').setDescription('The level to set the user to').setRequired(true).setMaxValue(1000))
        )
    ),
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply({ ephemeral: true });

    const { options, guild } = interaction;

    const { level } = await getGuildSettings(guild.id);
    const { ignoredRoles, ignoredChannels, enabledChannels, enabled, announcement, rewards, channelId } = level;

    switch (options.getSubcommandGroup()) {
      case 'show':
        {
          switch (options.getSubcommand()) {
            case 'all':
              {
                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.level)
                      .setTitle(t('level.title', { lng }))
                      .addFields(
                        {
                          name: t('level.state.title', { lng }),
                          value: enabled ? t('enabled', { lng }) : t('disabled', { lng })
                        },
                        {
                          name: t('level.announcement.title', { lng }),
                          value:
                            announcement === AnnouncementType.OtherChannel
                              ? `${AnnouncementType[announcement]}: <#${channelId}>`
                              : AnnouncementType[announcement]
                        },
                        {
                          name: t('level.ignored-roles.title', { lng }),
                          value: ignoredRoles.length
                            ? ignoredRoles
                                .map((id) => {
                                  if (guild.roles.cache.get(id)) return `<@&${id}>`;
                                  else return id;
                                })
                                .join(', ')
                            : t('level.none', { lng })
                        },
                        {
                          name: t('level.ignored-channels.title', { lng }),
                          value: ignoredChannels.length
                            ? ignoredChannels
                                .map((id) => {
                                  if (guild.channels.cache.get(id)) return `<#${id}>`;
                                  else return id;
                                })
                                .join(', ')
                            : t('level.none', { lng })
                        },
                        {
                          name: t('level.enabled-channels.title', { lng }),
                          value: enabledChannels.length
                            ? enabledChannels
                                .map((id) => {
                                  if (guild.channels.cache.get(id)) return `<#${id}>`;
                                  else return id;
                                })
                                .join(', ')
                            : t('level.none', { lng })
                        },
                        {
                          name: t('level.rewards.title', { lng }),
                          value: rewards.length ? rewards.map(({ level, roleId }) => `${level}: <@&${roleId}>`).join('\n') : t('level.none', { lng })
                        }
                      )
                  ]
                });
              }
              break;
            case 'state':
              {
                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.level)
                      .setTitle(t('level.title', { lng }))
                      .addFields({
                        name: t('level.state.title', { lng }),
                        value: enabled ? t('enabled', { lng }) : t('disabled', { lng })
                      })
                  ]
                });
              }
              break;
            case 'announcement':
              {
                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setTitle(t('level.title', { lng }))
                      .setColor(client.colors.level)
                      .addFields({
                        name: t('level.announcement.title', { lng }),
                        value:
                          announcement === AnnouncementType.OtherChannel ? `${AnnouncementType[announcement]}: <#${channelId}>` : AnnouncementType[announcement]
                      })
                  ]
                });
              }
              break;
            case 'rewards':
              {
                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.level)
                      .setTitle(t('level.title', { lng }))
                      .addFields({
                        name: t('level.rewards.title', { lng }),
                        value: rewards.length
                          ? rewards
                              .map(({ level, roleId }) => {
                                if (guild.roles.cache.get(roleId)) return `${level}: <@&${roleId}>`;
                                else return `${level}: ${roleId}`;
                              })
                              .join('\n')
                          : t('level.none', { lng })
                      })
                  ]
                });
              }
              break;
            case 'ignored-roles':
              {
                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.level)
                      .setTitle(t('level.title', { lng }))
                      .addFields({
                        name: t('level.ignored-roles.title', { lng }),
                        value: ignoredRoles.length
                          ? ignoredRoles
                              .map((id) => {
                                if (guild.roles.cache.get(id)) return `<@&${id}>`;
                                else return id;
                              })
                              .join(', ')
                          : t('level.none', { lng })
                      })
                  ]
                });
              }
              break;
            case 'ignored-channels':
              {
                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.level)
                      .setTitle(t('level.title', { lng }))
                      .addFields({
                        name: t('level.ignored-channels.title', { lng }),
                        value: ignoredChannels
                          ? ignoredChannels
                              .map((id) => {
                                if (guild.channels.cache.get(id)) return `<#${id}>`;
                                else return id;
                              })
                              .join(', ')
                          : t('level.none', { lng })
                      })
                  ]
                });
              }
              break;
            case 'enabled-channels':
              {
                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.level)
                      .setTitle(t('level.title', { lng }))
                      .addFields({
                        name: t('level.enabled-channels.title', { lng }),
                        value: enabledChannels
                          ? enabledChannels
                              .map((id) => {
                                if (guild.channels.cache.get(id)) return `<#${id}>`;
                                else return id;
                              })
                              .join(', ')
                          : t('level.none', { lng })
                      })
                  ]
                });
              }
              break;
          }
        }
        break;
      case 'toggle':
        {
          switch (options.getSubcommand()) {
            case 'on':
              {
                if (enabled) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.toggle.already-on', { lng }))]
                  });
                  return;
                }

                await updateGuildSettings(guild.id, { $set: { ['level.enabled']: true } });

                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.toggle.on', { lng }))]
                });
              }
              break;
            case 'off':
              {
                if (!enabled) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.toggle.already-off', { lng }))]
                  });
                  return;
                }

                await updateGuildSettings(guild.id, { $set: { ['level.enabled']: false } });

                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.toggle.off', { lng }))]
                });
              }
              break;
          }
        }
        break;
      case 'announcement':
        {
          switch (options.getSubcommand()) {
            case 'other-channel':
              {
                const channel = options.getChannel('channel', true, [ChannelType.GuildText]);

                if (channelId === channel.id && announcement !== AnnouncementType.OtherChannel) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.announcement.already-channel', { lng }))]
                  });
                  return;
                }

                await updateGuildSettings(guild.id, {
                  $set: {
                    ['level.channelId']: channel.id,
                    ['level.announcement']: AnnouncementType.OtherChannel
                  }
                });

                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.announcement.other', { lng }))]
                });
              }
              break;
            case 'user-channel':
              {
                if (announcement === AnnouncementType.UserChannel) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.announcement.already-user', { lng }))]
                  });
                  return;
                }

                await updateGuildSettings(guild.id, {
                  $set: {
                    ['level.channelId']: undefined,
                    ['level.announcement']: AnnouncementType.UserChannel
                  }
                });

                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.announcement.user', { lng }))]
                });
              }
              break;
            case 'private-message':
              {
                if (announcement === AnnouncementType.PrivateMessage) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.announcement.already-private', { lng }))]
                  });
                  return;
                }

                await updateGuildSettings(guild.id, {
                  $set: {
                    ['level.channelId']: undefined,
                    ['level.announcement']: AnnouncementType.PrivateMessage
                  }
                });

                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.announcement.private', { lng }))]
                });
              }
              break;
            case 'none':
              {
                if (announcement !== AnnouncementType.None) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.announcement.already-none', { lng }))]
                  });
                  return;
                }

                await updateGuildSettings(guild.id, {
                  $set: {
                    ['level.channelId']: undefined,
                    ['level.announcement']: AnnouncementType.None
                  }
                });

                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.announcement.none', { lng }))]
                });
              }
              break;
          }
        }
        break;
      case 'rewards':
        {
          switch (options.getSubcommand()) {
            case 'add':
              {
                const role = options.getRole('role', true);
                const level = options.getInteger('level', true);

                if (rewards.length >= 25) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.rewards.limit', { lng }))]
                  });
                  return;
                }

                const currentRoles = rewards.map((reward) => reward.roleId);

                if (currentRoles.includes(role.id)) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.rewards.already', { lng }))]
                  });
                  return;
                }

                await updateGuildSettings(guild.id, { $push: { ['level.rewards']: { level, roleId: role.id } } });

                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.rewards.added', { lng, level, role: role.toString() }))]
                });
              }
              break;
            case 'remove':
              {
                const roleId = options.getString('role-id', true);
                const reward = rewards.find((rw) => rw.roleId === roleId);

                if (!reward) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.rewards.invalid', { lng }))]
                  });
                  return;
                }

                await updateGuildSettings(guild.id, { $pull: { ['level.rewards']: { _id: reward._id } } });

                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.rewards.removed', { lng }))]
                });
              }
              break;
          }
        }
        break;
      case 'ignored-roles':
        {
          switch (options.getSubcommand()) {
            case 'add':
              {
                const role = options.getRole('role', true);

                if (ignoredRoles.includes(role.id)) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.ignored-roles.already', { lng }))]
                  });
                  return;
                }

                if (ignoredRoles.length >= 25) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.ignored-roles.limit', { lng }))]
                  });
                  return;
                }

                await updateGuildSettings(guild.id, { $push: { ['level.ignoredRoles']: role.id } });

                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.ignored-roles.added', { lng, role: role.toString() }))]
                });
              }
              break;
            case 'remove':
              {
                const roleId = options.getString('role-id', true);

                if (!ignoredRoles.includes(roleId)) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.ignored-roles.invalid', { lng }))]
                  });
                  return;
                }

                await updateGuildSettings(guild.id, { $pull: { ['level.ignoredRoles']: roleId } });

                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.ignored-roles.removed', { lng }))]
                });
              }
              break;
          }
        }
        break;
      case 'ignored-channels':
        {
          switch (options.getSubcommand()) {
            case 'add':
              {
                const channel = options.getChannel('channel', true, [ChannelType.GuildText]);

                if (ignoredChannels.includes(channel.id)) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.ignored-channels.already', { lng }))]
                  });
                  return;
                }

                if (ignoredChannels.length >= 25) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.ignored-channels.limit', { lng }))]
                  });
                  return;
                }

                await updateGuildSettings(guild.id, { $push: { ['level.ignoredChannels']: channel.id } });

                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.ignored-channels.added', { lng, channel: channel.toString() }))
                  ]
                });
              }
              break;
            case 'remove':
              {
                const channelId = options.getString('channel-id', true);

                if (!ignoredChannels.includes(channelId)) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.ignored-channels.invalid', { lng }))]
                  });
                  return;
                }

                await updateGuildSettings(guild.id, { $pull: { ['level.ignoredChannels']: channelId } });

                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.ignored-channels.removed', { lng }))]
                });
              }
              break;
          }
        }
        break;
      case 'enabled-channels':
        {
          switch (options.getSubcommand()) {
            case 'add':
              {
                const channel = options.getChannel('channel', true, [ChannelType.GuildText]);

                if (enabledChannels.includes(channel.id)) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.enabled-channels.already', { lng }))]
                  });
                  return;
                }

                if (enabledChannels.length >= 25) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.enabled-channels.limit', { lng }))]
                  });
                  return;
                }

                await updateGuildSettings(guild.id, { $push: { ['level.enabledChannels']: channel.id } });

                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.enabled-channels.added', { lng, channel: channel.toString() }))
                  ]
                });
              }
              break;
            case 'remove':
              {
                const channelId = options.getString('channel-id', true);

                if (!enabledChannels.includes(channelId)) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('level.enabled-channels.invalid', { lng }))]
                  });
                  return;
                }

                await updateGuildSettings(guild.id, { $pull: { ['level.enabledChannels']: channelId } });

                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.level).setDescription(t('level.enabled-channels.removed', { lng }))]
                });
              }
              break;
          }
        }
        break;
      case 'xp':
        {
          switch (options.getSubcommand()) {
            case 'add':
              {
                const xp = options.getInteger('xp', true);
                const user = options.getUser('user', true);

                if (user.bot) {
                  await interaction.editReply(t('level.bot', { lng }));
                  return;
                }

                const member = guild.members.cache.get(user.id);

                const userLevel = await addXP(user.id, guild.id, xp);
                const rewards = await getRewardsForLevel(userLevel);

                if (member && rewards.length) {
                  await member.roles
                    .add(rewards.map((reward) => reward.roleId))
                    .catch((err) => logger.debug({ err, userId: user.id }, 'Could not add role(s)'));
                }

                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.level)
                      .setDescription(t('level.xp.added', { lng, xp, user: user.toString(), newXP: userLevel.xp, newLevel: userLevel.level }))
                  ]
                });
              }
              break;
            case 'remove':
              {
                const xp = options.getInteger('xp', true);
                const user = options.getUser('user', true);

                if (user.bot) {
                  await interaction.editReply(t('level.bot', { lng }));
                  return;
                }

                const member = guild.members.cache.get(user.id);

                const currentLevel = await getLevelForce(user.id, guild.id);
                const updatedLevel = await addXP(user.id, guild.id, -xp);

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
              break;
            case 'set':
              {
                const user = options.getUser('user', true);
                const xp = options.getInteger('xp', true);

                if (user.bot) {
                  await interaction.editReply(t('level.bot', { lng }));
                  return;
                }

                const member = guild.members.cache.get(user.id);

                const userLevel = await setXP(user.id, guild.id, xp);
                const rewards = await getRewardsForLevel(userLevel);

                if (member && rewards.length) {
                  await member.roles
                    .add(rewards.map((reward) => reward.roleId))
                    .catch((err) => logger.debug({ err, userId: user.id }, 'Could not add role(s)'));
                }

                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.level)
                      .setDescription(t('level.xp.set', { lng, xp, user: user.toString(), newXP: userLevel.xp, newLevel: userLevel.level }))
                  ]
                });
              }
              break;
          }
        }
        break;
      case 'level':
        {
          switch (options.getSubcommand()) {
            case 'add':
              {
                const user = options.getUser('user', true);
                const level = options.getInteger('level', true);

                if (user.bot) {
                  await interaction.editReply(t('level.bot', { lng }));
                  return;
                }

                const member = guild.members.cache.get(user.id);

                const userLevel = await addLevel(user.id, guild.id, level);
                const rewards = await getRewardsForLevel(userLevel);

                if (member && rewards.length) {
                  await member.roles
                    .add(rewards.map((reward) => reward.roleId))
                    .catch((err) => logger.debug({ err, userId: user.id }, 'Could not add role(s)'));
                }

                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.level)
                      .setDescription(t('level.level.added', { lng, level, user: user.toString(), newXP: userLevel.xp, newLevel: userLevel.level }))
                  ]
                });
              }
              break;
            case 'remove':
              {
                const user = options.getUser('user', true);
                const level = options.getInteger('level', true);

                if (user.bot) {
                  await interaction.editReply(t('level.bot', { lng }));
                  return;
                }

                const member = guild.members.cache.get(user.id);

                const currentLevel = await getLevelForce(user.id, guild.id);
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
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.level)
                      .setDescription(t('level.level.removed', { lng, level, user: user.toString(), newXP: updatedLevel.xp, newLevel: updatedLevel.level }))
                  ]
                });
              }
              break;
            case 'set':
              {
                const user = options.getUser('user', true);
                const level = options.getInteger('level', true);

                if (user.bot) {
                  await interaction.editReply(t('level.bot', { lng }));
                  return;
                }

                const member = guild.members.cache.get(user.id);

                const userLevel = await setLevel(user.id, guild.id, level);
                const rewards = await getRewardsForLevel(userLevel);

                if (member && rewards.length) {
                  await member.roles
                    .add(rewards.map((reward) => reward.roleId))
                    .catch((err) => logger.debug({ err, userId: user.id }, 'Could not add role(s)'));
                }

                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.level)
                      .setDescription(t('level.level.set', { lng, level, user: user.toString(), newXP: userLevel.xp, newLevel: userLevel.level }))
                  ]
                });
              }
              break;
          }
        }
        break;
    }
  }
});

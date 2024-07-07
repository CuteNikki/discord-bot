import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, Colors, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

import { AnnouncementType } from 'models/guild';

import { addLevel, addXP, getDataOrCreate, getLevelRewards, setLevel, setXP } from 'utils/level';

export default new Command({
  module: ModuleType.CONFIG,
  data: {
    name: 'config-level',
    description: 'Configure the level module',
    default_member_permissions: `${PermissionFlagsBits.ManageGuild}`,
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
    options: [
      {
        name: 'show',
        description: 'Shows the current configuration',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'all',
            description: 'Shows the entire configuration',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'state',
            description: 'Shows the level module state',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'announcement',
            description: 'Shows the announcement configuration',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'rewards',
            description: 'Shows the level rewards',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'ignored-roles',
            description: 'Shows the ignored roles',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'ignored-channels',
            description: 'Shows the ignored channels',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'enabled-channels',
            description: 'Shows the enabled channels',
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
      {
        name: 'toggle',
        description: 'Toggle the level module',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'on',
            description: 'Turns the level module on',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'off',
            description: 'Turns the level module off',
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
      {
        name: 'announcement',
        description: 'Configure where a levelup will be announced',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'user-channel',
            description: 'Announces in channel of user and deletes after 5 seconds',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'other-channel',
            description: 'Announces in a specified channel',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'channel',
                description: 'The channel to send levelup announcements in',
                type: ApplicationCommandOptionType.Channel,
                channel_types: [ChannelType.GuildText],
                required: true,
              },
            ],
          },
          {
            name: 'private-message',
            description: 'Sends a direct message to the user',
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
      {
        name: 'rewards',
        description: 'Configure the level up rewards',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'add',
            description: 'Adds a level up reward',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'role',
                description: 'The role to give',
                type: ApplicationCommandOptionType.Role,
                required: true,
              },
              {
                name: 'level',
                description: 'The level required to get role',
                type: ApplicationCommandOptionType.Integer,
                required: true,
              },
            ],
          },
          {
            name: 'remove',
            description: 'Removes a level up reward',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'role-id',
                description: 'The id of role to remove',
                type: ApplicationCommandOptionType.String,
                required: true,
              },
            ],
          },
        ],
      },
      {
        name: 'ignored-roles',
        description: 'Configure the ignored roles',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'add',
            description: 'Adds an ignored role',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'role',
                description: 'The role to ignore',
                type: ApplicationCommandOptionType.Role,
                required: true,
              },
            ],
          },
          {
            name: 'remove',
            description: 'Removes an ignored role',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'role-id',
                description: 'The id of role to remove',
                type: ApplicationCommandOptionType.String,
                required: true,
              },
            ],
          },
        ],
      },
      {
        name: 'ignored-channels',
        description: 'Configure the ignored channels',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'add',
            description: 'Adds an ignored channel',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'channel',
                description: 'The channel to ignore',
                type: ApplicationCommandOptionType.Channel,
                required: true,
                channel_types: [ChannelType.GuildText],
              },
            ],
          },
          {
            name: 'remove',
            description: 'Removes an ignored channel',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'channel-id',
                description: 'The id of channel to remove',
                type: ApplicationCommandOptionType.String,
                required: true,
              },
            ],
          },
        ],
      },
      {
        name: 'enabled-channels',
        description: 'Configure the channels where levelling is enabled',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'add',
            description: 'Adds an enabled channel',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'channel',
                description: 'The channel to add',
                type: ApplicationCommandOptionType.Channel,
                required: true,
                channel_types: [ChannelType.GuildText],
              },
            ],
          },
          {
            name: 'remove',
            description: 'Removes an enabled channel',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'channel-id',
                description: 'The id of channel to remove',
                type: ApplicationCommandOptionType.String,
                required: true,
              },
            ],
          },
        ],
      },
      {
        name: 'xp',
        description: 'Manage the XP of a user',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'add',
            description: 'Adds XP to a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to add XP to',
                type: ApplicationCommandOptionType.User,
                required: true,
              },
              {
                name: 'xp',
                description: 'The XP to add to user',
                type: ApplicationCommandOptionType.Integer,
                max_value: 200000,
                required: true,
              },
            ],
          },
          {
            name: 'remove',
            description: 'Removes XP from a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to remove XP from',
                type: ApplicationCommandOptionType.User,
                required: true,
              },
              {
                name: 'xp',
                description: 'The XP to remove from user',
                type: ApplicationCommandOptionType.Integer,
                max_value: 200000,
                required: true,
              },
            ],
          },
          {
            name: 'set',
            description: 'Sets the XP of a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to set XP of',
                type: ApplicationCommandOptionType.User,
                required: true,
              },
              {
                name: 'xp',
                description: 'The XP to set the user to',
                type: ApplicationCommandOptionType.Integer,
                max_value: 200000,
                required: true,
              },
            ],
          },
        ],
      },
      {
        name: 'level',
        description: 'Manage the level of a user',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'add',
            description: 'Adds level to a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to add level to',
                type: ApplicationCommandOptionType.User,
                required: true,
              },
              {
                name: 'level',
                description: 'The level to add to user',
                type: ApplicationCommandOptionType.Integer,
                max_value: 1000,
                required: true,
              },
            ],
          },
          {
            name: 'remove',
            description: 'Removes level from a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to remove level from',
                type: ApplicationCommandOptionType.User,
                required: true,
              },
              {
                name: 'level',
                description: 'The level to remove from user',
                type: ApplicationCommandOptionType.Integer,
                max_value: 1000,
                required: true,
              },
            ],
          },
          {
            name: 'set',
            description: 'Sets the level of a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to set level of',
                type: ApplicationCommandOptionType.User,
                required: true,
              },
              {
                name: 'level',
                description: 'The level to set the user to',
                type: ApplicationCommandOptionType.Integer,
                max_value: 1000,
                required: true,
              },
            ],
          },
        ],
      },
    ],
  },
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;
    const { options, guildId, guild } = interaction;
    await interaction.deferReply({ ephemeral: true });
    const lng = await client.getUserLanguage(interaction.user.id);

    const config = await client.getGuildSettings(guildId);

    switch (options.getSubcommandGroup()) {
      case 'show':
        {
          switch (options.getSubcommand()) {
            case 'all':
              {
                const allConfigEmbed = new EmbedBuilder()
                  .setColor(Colors.Blurple)
                  .setTitle(i18next.t('level.title', { lng }))
                  .addFields(
                    {
                      name: i18next.t('level.state.title', { lng }),
                      value: config.level.enabled ? i18next.t('level.state.enabled', { lng }) : i18next.t('level.state.disabled', { lng }),
                    },
                    {
                      name: i18next.t('level.announcement.title', { lng }),
                      value:
                        config.level.announcement === AnnouncementType.OTHER_CHANNEL
                          ? `${config.level.announcement}: <#${config.level.channelId}>`
                          : config.level.announcement.toString(),
                    }
                  );
                if (config.level.ignoredRoles.length)
                  allConfigEmbed.addFields({
                    name: i18next.t('level.ignored_roles.title', { lng }),
                    value: config.level.ignoredRoles
                      .map((id) => {
                        if (guild.roles.cache.get(id)) return `<@&${id}>`;
                        else return id;
                      })
                      .join(', '),
                  });
                if (config.level.ignoredChannels.length)
                  allConfigEmbed.addFields({
                    name: i18next.t('level.ignored_channels.title', { lng }),
                    value: config.level.ignoredChannels
                      .map((id) => {
                        if (guild.channels.cache.get(id)) return `<#${id}>`;
                        else return id;
                      })
                      .join(', '),
                  });
                if (config.level.enabledChannels.length)
                  allConfigEmbed.addFields({
                    name: i18next.t('level.enabled_channels.title', { lng }),
                    value: config.level.enabledChannels
                      .map((id) => {
                        if (guild.channels.cache.get(id)) return `<#${id}>`;
                        else return id;
                      })
                      .join(', '),
                  });
                if (config.level.rewards.length)
                  allConfigEmbed.addFields({
                    name: i18next.t('level.rewards.title', { lng }),
                    value: config.level.rewards
                      .map(({ level, roleId }) => {
                        if (guild.roles.cache.get(roleId)) return `${level}: <@&${roleId}>`;
                        else return `${level}: ${roleId}`;
                      })
                      .join('\n'),
                  });
                interaction.editReply({
                  embeds: [allConfigEmbed],
                });
              }
              break;
            case 'state':
              {
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(Colors.Blurple)
                      .setTitle(i18next.t('level.title', { lng }))
                      .addFields({
                        name: i18next.t('level.state.title', { lng }),
                        value: config.level.enabled ? i18next.t('level.state.enabled', { lng }) : i18next.t('level.state.disabled', { lng }),
                      }),
                  ],
                });
              }
              break;
            case 'announcement':
              {
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder().addFields({
                      name: i18next.t('level.announcement.title', { lng }),
                      value: config.level.announcement.toString(),
                    }),
                  ],
                });
              }
              break;
            case 'rewards':
              {
                if (!config.level.rewards.length) return interaction.editReply(i18next.t('level.none', { lng }));
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder().addFields({
                      name: i18next.t('level.rewards.title', { lng }),
                      value: config.level.rewards
                        .map(({ level, roleId }) => {
                          if (guild.roles.cache.get(roleId)) return `${level}: <@&${roleId}>`;
                          else return `${level}: ${roleId}`;
                        })
                        .join('\n'),
                    }),
                  ],
                });
              }
              break;
            case 'ignored-roles':
              {
                if (!config.level.ignoredRoles.length) return interaction.editReply(i18next.t('level.none', { lng }));
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder().addFields({
                      name: i18next.t('level.ignored_roles.title', { lng }),
                      value: config.level.ignoredRoles
                        .map((id) => {
                          if (guild.roles.cache.get(id)) return `<@&${id}>`;
                          else return id;
                        })
                        .join(', '),
                    }),
                  ],
                });
              }
              break;
            case 'ignored-channels':
              {
                if (!config.level.ignoredChannels.length) return interaction.editReply(i18next.t('level.none', { lng }));
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder().addFields({
                      name: i18next.t('level.ignored_channels.title', { lng }),
                      value: config.level.ignoredChannels
                        .map((id) => {
                          if (guild.channels.cache.get(id)) return `<#${id}>`;
                          else return id;
                        })
                        .join(', '),
                    }),
                  ],
                });
              }
              break;
            case 'enabled-channels':
              {
                if (!config.level.enabledChannels.length) return interaction.editReply(i18next.t('level.none', { lng }));
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder().addFields({
                      name: i18next.t('level.enabled_channels.title', { lng }),
                      value: config.level.enabledChannels
                        .map((id) => {
                          if (guild.channels.cache.get(id)) return `<#${id}>`;
                          else return id;
                        })
                        .join(', '),
                    }),
                  ],
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
                if (config.level.enabled) return interaction.editReply(i18next.t('level.toggle.already_on', { lng }));
                await client.updateGuildSettings(guildId, { $set: { ['level.enabled']: true } });
                interaction.editReply(i18next.t('level.toggle.on', { lng }));
              }
              break;
            case 'off':
              {
                if (!config.level.enabled) return interaction.editReply(i18next.t('level.toggle.already_off', { lng }));
                await client.updateGuildSettings(guildId, { $set: { ['level.enabled']: false } });
                interaction.editReply(i18next.t('level.toggle.off', { lng }));
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
                if (config.level.channelId === channel.id && config.level.announcement !== AnnouncementType.OTHER_CHANNEL)
                  return interaction.editReply(i18next.t('level.announcement.already_channel', { lng }));
                await client.updateGuildSettings(guildId, {
                  $set: { ['level.channelId']: channel.id, ['level.announcement']: AnnouncementType.OTHER_CHANNEL },
                });
                interaction.editReply(i18next.t('level.announcement.other', { lng }));
              }
              break;
            case 'user-channel':
              {
                if (config.level.announcement === AnnouncementType.USER_CHANNEL)
                  return interaction.editReply(i18next.t('level.announcement.already_user', { lng }));
                await client.updateGuildSettings(guildId, { $set: { ['level.channelId']: undefined, ['level.announcement']: AnnouncementType.USER_CHANNEL } });
                interaction.editReply(i18next.t('level.announcement.user', { lng }));
              }
              break;
            case 'private-message':
              {
                if (config.level.announcement === AnnouncementType.PRIVATE_MESSAGE)
                  return interaction.editReply(i18next.t('level.announcement.already_private', { lng }));
                await client.updateGuildSettings(guildId, {
                  $set: { ['level.channelId']: undefined, ['level.announcement']: AnnouncementType.PRIVATE_MESSAGE },
                });
                interaction.editReply(i18next.t('level.announcement.private', { lng }));
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
                if (config.level.rewards.length >= 25) return interaction.editReply(i18next.t('level.rewards.limit', { lng }));
                const currentRoles = config.level.rewards.map((reward) => reward.roleId);
                if (currentRoles.includes(role.id)) return interaction.editReply(i18next.t('level.rewards.already', { lng }));
                await client.updateGuildSettings(guildId, { $push: { ['level.rewards']: { level, roleId: role.id } } });
                interaction.editReply(i18next.t('level.rewards.added', { lng, level, role: role.toString() }));
              }
              break;
            case 'remove':
              {
                const roleId = options.getString('role-id', true);
                const reward = config.level.rewards.find((rw) => rw.roleId === roleId);
                if (!reward) return interaction.editReply(i18next.t('level.rewards.invalid', { lng }));
                await client.updateGuildSettings(guildId, { $pull: { ['level.rewards']: { _id: reward._id } } });
                interaction.editReply(i18next.t('level.rewards.removed', { lng }));
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
                if (config.level.ignoredRoles.includes(role.id)) return interaction.editReply(i18next.t('level.ignored_roles.already', { lng }));
                if (config.level.ignoredRoles.length >= 25) return interaction.editReply(i18next.t('level.ignored_roles.limit', { lng }));
                await client.updateGuildSettings(guildId, { $push: { ['level.ignoredRoles']: role.id } });
                interaction.editReply(i18next.t('level.ignored_roles.added', { lng, role: role.toString() }));
              }
              break;
            case 'remove':
              {
                const roleId = options.getString('role-id', true);
                if (!config.level.ignoredRoles.includes(roleId)) return interaction.editReply(i18next.t('level.ignored_roles.invalid', { lng }));
                await client.updateGuildSettings(guildId, { $pull: { ['level.ignoredRoles']: roleId } });
                interaction.editReply(i18next.t('level.ignored_roles.removed', { lng }));
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
                if (config.level.ignoredChannels.includes(channel.id)) return interaction.editReply(i18next.t('level.ignored_channels.already', { lng }));
                if (config.level.ignoredChannels.length >= 25) return interaction.editReply(i18next.t('level.ignored_channels.limit', { lng }));
                await client.updateGuildSettings(guildId, { $push: { ['level.ignoredChannels']: channel.id } });
                interaction.editReply(i18next.t('level.ignored_channels.added', { lng, channel: channel.toString() }));
              }
              break;
            case 'remove':
              {
                const channelId = options.getString('channel-id', true);
                if (!config.level.ignoredChannels.includes(channelId)) return interaction.editReply(i18next.t('level.ignored_channels.invalid', { lng }));
                await client.updateGuildSettings(guildId, { $pull: { ['level.ignoredChannels']: channelId } });
                interaction.editReply(i18next.t('level.ignored_channels.removed', { lng }));
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
                if (config.level.enabledChannels.includes(channel.id)) return interaction.editReply(i18next.t('level.enabled_channels.already', { lng }));
                if (config.level.enabledChannels.length >= 25) return interaction.editReply(i18next.t('level.enabled_channels.limit', { lng }));
                await client.updateGuildSettings(guildId, { $push: { ['level.enabledChannels']: channel.id } });
                interaction.editReply(i18next.t('level.enabled_channels.added', { lng, channel: channel.toString() }));
              }
              break;
            case 'remove':
              {
                const channelId = options.getString('channel-id', true);
                if (!config.level.enabledChannels.includes(channelId)) return interaction.editReply(i18next.t('level.enabled_channels.invalid', { lng }));
                await client.updateGuildSettings(guildId, { $pull: { ['level.enabledChannels']: channelId } });
                interaction.editReply(i18next.t('level.enabled_channels.removed', { lng }));
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
                const user = options.getUser('user', true);
                const member = guild.members.cache.get(user.id);

                if (user.bot) return interaction.editReply(i18next.t('level.bot', { lng }));

                const xp = options.getInteger('xp', true);
                const userLevel = await addXP({ userId: user.id, guildId }, client, xp);
                const rewards = await getLevelRewards(client, userLevel);

                if (member && rewards.length) {
                  await member.roles.add(rewards.map((reward) => reward.roleId)).catch(() => {});
                }

                interaction.editReply(i18next.t('level.xp.added', { lng, user: user.toString(), xp, new_xp: userLevel.xp, new_level: userLevel.level }));
              }
              break;
            case 'remove':
              {
                const user = options.getUser('user', true);
                const member = guild.members.cache.get(user.id);

                if (user.bot) return interaction.editReply(i18next.t('level.bot', { lng }));

                const xp = options.getInteger('xp', true);
                const currentLevel = await getDataOrCreate({ userId: user.id, guildId }, client);
                const userLevel = await addXP({ userId: user.id, guildId }, client, -xp);
                const oldRewards = await getLevelRewards(client, currentLevel);
                const newRewards = await getLevelRewards(client, userLevel);

                if (member && (oldRewards.length || newRewards.length)) {
                  await member.roles
                    .set([
                      ...member.roles.cache.map((role) => role.id).filter((id) => !oldRewards.map((reward) => reward.roleId).includes(id)),
                      ...newRewards.map((reward) => reward.roleId),
                    ])
                    .catch(() => {});
                }

                interaction.editReply(i18next.t('level.xp.removed', { lng, user: user.toString(), xp, new_xp: userLevel.xp, new_level: userLevel.level }));
              }
              break;
            case 'set':
              {
                const user = options.getUser('user', true);
                const member = guild.members.cache.get(user.id);

                if (user.bot) return interaction.editReply(i18next.t('level.bot', { lng }));

                const xp = options.getInteger('xp', true);
                const userLevel = await setXP({ userId: user.id, guildId }, client, xp);
                const rewards = await getLevelRewards(client, userLevel);

                if (member && rewards.length) {
                  await member.roles.add(rewards.map((reward) => reward.roleId)).catch(() => {});
                }

                interaction.editReply(i18next.t('level.xp.set', { lng, user: user.toString(), xp, new_xp: userLevel.xp, new_level: userLevel.level }));
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
                const member = guild.members.cache.get(user.id);

                if (user.bot) return interaction.editReply(i18next.t('level.bot', { lng }));

                const level = options.getInteger('level', true);
                const userLevel = await addLevel({ userId: user.id, guildId }, client, level);
                const rewards = await getLevelRewards(client, userLevel);

                if (member && rewards.length) {
                  await member.roles.add(rewards.map((reward) => reward.roleId)).catch(() => {});
                }

                interaction.editReply(i18next.t('level.level.added', { lng, user: user.toString(), level, new_xp: userLevel.xp, new_level: userLevel.level }));
              }
              break;
            case 'remove':
              {
                const user = options.getUser('user', true);
                const member = guild.members.cache.get(user.id);

                if (user.bot) return interaction.editReply(i18next.t('level.bot', { lng }));

                const level = options.getInteger('level', true);
                const currentLevel = await getDataOrCreate({ userId: user.id, guildId }, client);
                const userLevel = await addLevel({ userId: user.id, guildId }, client, -level);
                const oldRewards = await getLevelRewards(client, currentLevel);
                const newRewards = await getLevelRewards(client, userLevel);

                if (member && (oldRewards.length || newRewards.length)) {
                  await member.roles
                    .set([
                      ...member.roles.cache.map((role) => role.id).filter((id) => !oldRewards.map((reward) => reward.roleId).includes(id)),
                      ...newRewards.map((reward) => reward.roleId),
                    ])
                    .catch(() => {});
                }

                interaction.editReply(
                  i18next.t('level.level.removed', { lng, user: user.toString(), level, new_xp: userLevel.xp, new_level: userLevel.level })
                );
              }
              break;
            case 'set':
              {
                const user = options.getUser('user', true);
                const member = guild.members.cache.get(user.id);

                if (user.bot) return interaction.editReply(i18next.t('level.bot', { lng }));

                const level = options.getInteger('level', true);
                const userLevel = await setLevel({ userId: user.id, guildId }, client, level);
                const rewards = await getLevelRewards(client, userLevel);

                if (member && rewards.length) {
                  await member.roles.add(rewards.map((reward) => reward.roleId)).catch(() => {});
                }

                interaction.editReply(i18next.t('level.level.set', { lng, user: user.toString(), new_xp: userLevel.xp, new_level: userLevel.level }));
              }
              break;
          }
        }
        break;
    }
  },
});

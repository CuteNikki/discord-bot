import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, Colors, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';

import { AnnouncementType, guildModel } from 'models/guild';

import { addLevel, addXP, setLevel, setXP } from 'utils/levels';

export default new Command({
  module: Modules.CONFIG,
  data: {
    name: 'config-levels',
    description: 'Configure the level module',
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
            description: 'Shows the levels module state',
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
            description: 'Adds levels to a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to add levels to',
                type: ApplicationCommandOptionType.User,
                required: true,
              },
              {
                name: 'levels',
                description: 'The levels to add to user',
                type: ApplicationCommandOptionType.Integer,
                max_value: 1000,
                required: true,
              },
            ],
          },
          {
            name: 'remove',
            description: 'Removes levels from a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to remove levels from',
                type: ApplicationCommandOptionType.User,
                required: true,
              },
              {
                name: 'levels',
                description: 'The levels to remove from user',
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
    const lng = await client.getLanguage(interaction.user.id);

    const config = await client.getGuildSettings(guildId);

    switch (options.getSubcommandGroup()) {
      case 'show':
        {
          switch (options.getSubcommand()) {
            case 'all':
              {
                const allConfigEmbed = new EmbedBuilder()
                  .setColor(Colors.Blurple)
                  .setTitle(i18next.t('levels.title', { lng }))
                  .addFields(
                    {
                      name: i18next.t('levels.state.title', { lng }),
                      value: config.levels.enabled ? i18next.t('levels.state.enabled', { lng }) : i18next.t('levels.state.disabled', { lng }),
                    },
                    {
                      name: i18next.t('levels.announcement.title', { lng }),
                      value:
                        config.levels.announcement === AnnouncementType.OTHER_CHANNEL
                          ? `${config.levels.announcement}: <#${config.levels.channelId}>`
                          : config.levels.announcement.toString(),
                    }
                  );
                if (config.levels.ignoredRoles.length)
                  allConfigEmbed.addFields({
                    name: i18next.t('levels.ignored_roles.title', { lng }),
                    value: config.levels.ignoredRoles
                      .map((id) => {
                        if (guild.roles.cache.get(id)) return `<@&${id}>`;
                        else return id;
                      })
                      .join(', '),
                  });
                if (config.levels.ignoredChannels.length)
                  allConfigEmbed.addFields({
                    name: i18next.t('levels.ignored_channels.title', { lng }),
                    value: config.levels.ignoredChannels
                      .map((id) => {
                        if (guild.channels.cache.get(id)) return `<#${id}>`;
                        else return id;
                      })
                      .join(', '),
                  });
                if (config.levels.enabledChannels.length)
                  allConfigEmbed.addFields({
                    name: i18next.t('levels.enabled_channels.title', { lng }),
                    value: config.levels.enabledChannels
                      .map((id) => {
                        if (guild.channels.cache.get(id)) return `<#${id}>`;
                        else return id;
                      })
                      .join(', '),
                  });
                if (config.levels.rewards.length)
                  allConfigEmbed.addFields({
                    name: i18next.t('levels.rewards.title', { lng }),
                    value: config.levels.rewards
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
                      .setTitle(i18next.t('levels.title', { lng }))
                      .addFields({
                        name: i18next.t('levels.state.title', { lng }),
                        value: config.levels.enabled ? i18next.t('levels.state.enabled', { lng }) : i18next.t('levels.state.disabled', { lng }),
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
                      name: i18next.t('levels.announcement.title', { lng }),
                      value: config.levels.announcement.toString(),
                    }),
                  ],
                });
              }
              break;
            case 'rewards':
              {
                if (!config.levels.rewards.length) return interaction.editReply(i18next.t('levels.rewards.none', { lng }));
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder().addFields({
                      name: i18next.t('levels.rewards.title', { lng }),
                      value: config.levels.rewards
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
                if (!config.levels.ignoredRoles.length) return interaction.editReply(i18next.t('levels.ignored_roles.none', { lng }));
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder().addFields({
                      name: i18next.t('levels.ignored_roles.title', { lng }),
                      value: config.levels.ignoredRoles
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
                if (!config.levels.ignoredChannels.length) return interaction.editReply(i18next.t('levels.ignored_channels.none', { lng }));
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder().addFields({
                      name: i18next.t('levels.ignored_channels.title', { lng }),
                      value: config.levels.ignoredChannels
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
                if (!config.levels.enabledChannels.length) return interaction.editReply(i18next.t('levels.enabledChannels.none', { lng }));
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder().addFields({
                      name: i18next.t('levels.enabled_channels.title', { lng }),
                      value: config.levels.enabledChannels
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
                if (config.levels.enabled) return interaction.editReply(i18next.t('levels.toggle.already_on', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $set: { ['levels.enabled']: true } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('levels.toggle.on', { lng }));
              }
              break;
            case 'off':
              {
                if (!config.levels.enabled) return interaction.editReply(i18next.t('levels.toggle.already_off', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $set: { ['levels.enabled']: false } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('levels.toggle.off', { lng }));
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
                if (config.levels.channelId === channel.id && config.levels.announcement !== AnnouncementType.OTHER_CHANNEL)
                  return interaction.editReply(i18next.t('levels.announcement.already_channel', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate(
                    { guildId },
                    { $set: { ['levels.channelId']: channel.id, ['levels.announcement']: AnnouncementType.OTHER_CHANNEL } },
                    { new: true, upsert: true }
                  )
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('levels.announcement.other', { lng }));
              }
              break;
            case 'user-channel':
              {
                if (config.levels.announcement === AnnouncementType.USER_CHANNEL)
                  return interaction.editReply(i18next.t('levels.announcement.already_user', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate(
                    { guildId },
                    { $set: { ['levels.channelId']: undefined, ['levels.announcement']: AnnouncementType.USER_CHANNEL } },
                    { new: true, upsert: true }
                  )
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('levels.announcement.user', { lng }));
              }
              break;
            case 'private-message':
              {
                if (config.levels.announcement === AnnouncementType.PRIVATE_MESSAGE)
                  return interaction.editReply(i18next.t('levels.announcement.already_private', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate(
                    { guildId },
                    { $set: { ['levels.channelId']: undefined, ['levels.announcement']: AnnouncementType.PRIVATE_MESSAGE } },
                    { new: true, upsert: true }
                  )
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('levels.announcement.private', { lng }));
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
                if (config.levels.rewards.length >= 25) return interaction.editReply(i18next.t('levels.rewards.limit', { lng }));
                const currentRoles = config.levels.rewards.map((reward) => reward.roleId);
                if (currentRoles.includes(role.id)) return interaction.editReply(i18next.t('levels.rewards.already', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $push: { ['levels.rewards']: { level, roleId: role.id } } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('levels.rewards.added', { lng, level, role: role.toString() }));
              }
              break;
            case 'remove':
              {
                const roleId = options.getString('role-id', true);
                const reward = config.levels.rewards.find((rw) => rw.roleId === roleId);
                if (!reward) return interaction.editReply(i18next.t('levels.rewards.invalid', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $pull: { ['levels.rewards']: { _id: reward._id } } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('levels.rewards.removed', { lng }));
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
                if (config.levels.ignoredRoles.includes(role.id)) return interaction.editReply(i18next.t('levels.ignored_roles.already', { lng }));
                if (config.levels.ignoredRoles.length >= 25) return interaction.editReply(i18next.t('levels.ignored_roles.limit', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $push: { ['levels.ignoredRoles']: role.id } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('levels.ignored_roles.added', { lng, role: role.toString() }));
              }
              break;
            case 'remove':
              {
                const roleId = options.getString('role-id', true);
                if (!config.levels.ignoredRoles.includes(roleId)) return interaction.editReply(i18next.t('levels.ignored_roles.invalid', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $pull: { ['levels.ignoredRoles']: roleId } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('levels.ignored_roles.removed', { lng }));
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
                if (config.levels.ignoredChannels.includes(channel.id)) return interaction.editReply(i18next.t('levels.ignored_channels.already', { lng }));
                if (config.levels.ignoredChannels.length >= 25) return interaction.editReply(i18next.t('levels.ignored_channels.limit', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $push: { ['levels.ignoredChannels']: channel.id } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('levels.ignored_channels.added', { lng, channel: channel.toString() }));
              }
              break;
            case 'remove':
              {
                const channelId = options.getString('channel-id', true);
                if (!config.levels.ignoredChannels.includes(channelId)) return interaction.editReply(i18next.t('levels.ignored_channels.invalid', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $pull: { ['levels.ignoredChannels']: channelId } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('levels.ignored_channels.removed', { lng }));
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
                if (config.levels.enabledChannels.includes(channel.id)) return interaction.editReply(i18next.t('levels.enabled_channels.already', { lng }));
                if (config.levels.enabledChannels.length >= 25) return interaction.editReply(i18next.t('levels.enabled_channels.limit', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $push: { ['levels.enabledChannels']: channel.id } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('levels.enabled_channels.added', { lng, channel: channel.toString() }));
              }
              break;
            case 'remove':
              {
                const channelId = options.getString('channel-id', true);
                if (!config.levels.enabledChannels.includes(channelId)) return interaction.editReply(i18next.t('levels.enabled_channels.invalid', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $pull: { ['levels.enabledChannels']: channelId } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('levels.enabled_channels.removed', { lng }));
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
                if (user.bot) return interaction.editReply(i18next.t('levels.bot', { lng }));
                const xp = options.getInteger('xp', true);
                const userLevel = await addXP({ userId: user.id, guildId }, client, xp);
                interaction.editReply(i18next.t('levels.xp.added', { lng, user: user.toString(), xp, new_xp: userLevel.xp, new_level: userLevel.level }));
              }
              break;
            case 'remove':
              {
                const user = options.getUser('user', true);
                if (user.bot) return interaction.editReply(i18next.t('levels.bot', { lng }));
                const xp = options.getInteger('xp', true);
                const userLevel = await addXP({ userId: user.id, guildId }, client, -xp);
                interaction.editReply(i18next.t('levels.xp.removed', { lng, user: user.toString(), xp, new_xp: userLevel.xp, new_level: userLevel.level }));
              }
              break;
            case 'set':
              {
                const user = options.getUser('user', true);
                if (user.bot) return interaction.editReply(i18next.t('levels.bot', { lng }));
                const xp = options.getInteger('xp', true);
                const userLevel = await setXP({ userId: user.id, guildId }, client, xp);
                interaction.editReply(i18next.t('levels.xp.set', { lng, user: user.toString(), xp, new_xp: userLevel.xp, new_level: userLevel.level }));
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
                if (user.bot) return interaction.editReply(i18next.t('levels.bot', { lng }));
                const levels = options.getInteger('levels', true);
                const userLevel = await addLevel({ userId: user.id, guildId }, client, levels);
                interaction.editReply(
                  i18next.t('levels.level.added', { lng, user: user.toString(), levels, new_xp: userLevel.xp, new_level: userLevel.level })
                );
              }
              break;
            case 'remove':
              {
                const user = options.getUser('user', true);
                if (user.bot) return interaction.editReply(i18next.t('levels.bot', { lng }));
                const levels = options.getInteger('levels', true);
                const userLevel = await addLevel({ userId: user.id, guildId }, client, -levels);
                interaction.editReply(
                  i18next.t('levels.level.removed', { lng, user: user.toString(), levels, new_xp: userLevel.xp, new_level: userLevel.level })
                );
              }
              break;
            case 'set':
              {
                const user = options.getUser('user', true);
                if (user.bot) return interaction.editReply(i18next.t('levels.bot', { lng }));
                const level = options.getInteger('level', true);
                const userLevel = await setLevel({ userId: user.id, guildId }, client, level);
                interaction.editReply(i18next.t('levels.level.set', { lng, user: user.toString(), new_xp: userLevel.xp, new_level: userLevel.level }));
              }
              break;
          }
        }
        break;
    }
  },
});

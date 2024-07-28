import { ApplicationIntegrationType, ChannelType, Colors, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { AnnouncementType } from 'models/guild';

import { addLevel, addXP, getDataOrCreate, getLevelRewards, setLevel, setXP } from 'utils/level';
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
                  .setTitle(t('level.title', { lng }))
                  .addFields(
                    {
                      name: t('level.state.title', { lng }),
                      value: config.level.enabled ? t('level.state.enabled', { lng }) : t('level.state.disabled', { lng }),
                    },
                    {
                      name: t('level.announcement.title', { lng }),
                      value:
                        config.level.announcement === AnnouncementType.OtherChannel
                          ? `${AnnouncementType[config.level.announcement]}: <#${config.level.channelId}>`
                          : AnnouncementType[config.level.announcement],
                    }
                  );
                if (config.level.ignoredRoles.length)
                  allConfigEmbed.addFields({
                    name: t('level.ignored_roles.title', { lng }),
                    value: config.level.ignoredRoles
                      .map((id) => {
                        if (guild.roles.cache.get(id)) return `<@&${id}>`;
                        else return id;
                      })
                      .join(', '),
                  });
                if (config.level.ignoredChannels.length)
                  allConfigEmbed.addFields({
                    name: t('level.ignored_channels.title', { lng }),
                    value: config.level.ignoredChannels
                      .map((id) => {
                        if (guild.channels.cache.get(id)) return `<#${id}>`;
                        else return id;
                      })
                      .join(', '),
                  });
                if (config.level.enabledChannels.length)
                  allConfigEmbed.addFields({
                    name: t('level.enabled_channels.title', { lng }),
                    value: config.level.enabledChannels
                      .map((id) => {
                        if (guild.channels.cache.get(id)) return `<#${id}>`;
                        else return id;
                      })
                      .join(', '),
                  });
                if (config.level.rewards.length)
                  allConfigEmbed.addFields({
                    name: t('level.rewards.title', { lng }),
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
                      .setTitle(t('level.title', { lng }))
                      .addFields({
                        name: t('level.state.title', { lng }),
                        value: config.level.enabled ? t('level.state.enabled', { lng }) : t('level.state.disabled', { lng }),
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
                      name: t('level.announcement.title', { lng }),
                      value:
                        config.level.announcement === AnnouncementType.OtherChannel
                          ? `${AnnouncementType[config.level.announcement]}: <#${config.level.channelId}>`
                          : AnnouncementType[config.level.announcement],
                    }),
                  ],
                });
              }
              break;
            case 'rewards':
              {
                if (!config.level.rewards.length) return interaction.editReply(t('level.none', { lng }));
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder().addFields({
                      name: t('level.rewards.title', { lng }),
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
                if (!config.level.ignoredRoles.length) return interaction.editReply(t('level.none', { lng }));
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder().addFields({
                      name: t('level.ignored_roles.title', { lng }),
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
                if (!config.level.ignoredChannels.length) return interaction.editReply(t('level.none', { lng }));
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder().addFields({
                      name: t('level.ignored_channels.title', { lng }),
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
                if (!config.level.enabledChannels.length) return interaction.editReply(t('level.none', { lng }));
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder().addFields({
                      name: t('level.enabled_channels.title', { lng }),
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
                if (config.level.enabled) return interaction.editReply(t('level.toggle.already_on', { lng }));
                await client.updateGuildSettings(guildId, { $set: { ['level.enabled']: true } });
                interaction.editReply(t('level.toggle.on', { lng }));
              }
              break;
            case 'off':
              {
                if (!config.level.enabled) return interaction.editReply(t('level.toggle.already_off', { lng }));
                await client.updateGuildSettings(guildId, { $set: { ['level.enabled']: false } });
                interaction.editReply(t('level.toggle.off', { lng }));
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
                if (config.level.channelId === channel.id && config.level.announcement !== AnnouncementType.OtherChannel)
                  return interaction.editReply(t('level.announcement.already_channel', { lng }));
                await client.updateGuildSettings(guildId, {
                  $set: { ['level.channelId']: channel.id, ['level.announcement']: AnnouncementType.OtherChannel },
                });
                interaction.editReply(t('level.announcement.other', { lng }));
              }
              break;
            case 'user-channel':
              {
                if (config.level.announcement === AnnouncementType.UserChannel) return interaction.editReply(t('level.announcement.already_user', { lng }));
                await client.updateGuildSettings(guildId, { $set: { ['level.channelId']: undefined, ['level.announcement']: AnnouncementType.UserChannel } });
                interaction.editReply(t('level.announcement.user', { lng }));
              }
              break;
            case 'private-message':
              {
                if (config.level.announcement === AnnouncementType.PrivateMessage)
                  return interaction.editReply(t('level.announcement.already_private', { lng }));
                await client.updateGuildSettings(guildId, {
                  $set: { ['level.channelId']: undefined, ['level.announcement']: AnnouncementType.PrivateMessage },
                });
                interaction.editReply(t('level.announcement.private', { lng }));
              }
              break;
            case 'none':
              {
                if (config.level.announcement !== AnnouncementType.None) return interaction.editReply(t('level.announcement.already_none', { lng }));
                await client.updateGuildSettings(guildId, { $set: { ['level.channelId']: undefined, ['level.announcement']: AnnouncementType.None } });
                interaction.editReply(t('level.announcement.none', { lng }));
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
                if (config.level.rewards.length >= 25) return interaction.editReply(t('level.rewards.limit', { lng }));
                const currentRoles = config.level.rewards.map((reward) => reward.roleId);
                if (currentRoles.includes(role.id)) return interaction.editReply(t('level.rewards.already', { lng }));
                await client.updateGuildSettings(guildId, { $push: { ['level.rewards']: { level, roleId: role.id } } });
                interaction.editReply(t('level.rewards.added', { lng, level, role: role.toString() }));
              }
              break;
            case 'remove':
              {
                const roleId = options.getString('role-id', true);
                const reward = config.level.rewards.find((rw) => rw.roleId === roleId);
                if (!reward) return interaction.editReply(t('level.rewards.invalid', { lng }));
                await client.updateGuildSettings(guildId, { $pull: { ['level.rewards']: { _id: reward._id } } });
                interaction.editReply(t('level.rewards.removed', { lng }));
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
                if (config.level.ignoredRoles.includes(role.id)) return interaction.editReply(t('level.ignored_roles.already', { lng }));
                if (config.level.ignoredRoles.length >= 25) return interaction.editReply(t('level.ignored_roles.limit', { lng }));
                await client.updateGuildSettings(guildId, { $push: { ['level.ignoredRoles']: role.id } });
                interaction.editReply(t('level.ignored_roles.added', { lng, role: role.toString() }));
              }
              break;
            case 'remove':
              {
                const roleId = options.getString('role-id', true);
                if (!config.level.ignoredRoles.includes(roleId)) return interaction.editReply(t('level.ignored_roles.invalid', { lng }));
                await client.updateGuildSettings(guildId, { $pull: { ['level.ignoredRoles']: roleId } });
                interaction.editReply(t('level.ignored_roles.removed', { lng }));
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
                if (config.level.ignoredChannels.includes(channel.id)) return interaction.editReply(t('level.ignored_channels.already', { lng }));
                if (config.level.ignoredChannels.length >= 25) return interaction.editReply(t('level.ignored_channels.limit', { lng }));
                await client.updateGuildSettings(guildId, { $push: { ['level.ignoredChannels']: channel.id } });
                interaction.editReply(t('level.ignored_channels.added', { lng, channel: channel.toString() }));
              }
              break;
            case 'remove':
              {
                const channelId = options.getString('channel-id', true);
                if (!config.level.ignoredChannels.includes(channelId)) return interaction.editReply(t('level.ignored_channels.invalid', { lng }));
                await client.updateGuildSettings(guildId, { $pull: { ['level.ignoredChannels']: channelId } });
                interaction.editReply(t('level.ignored_channels.removed', { lng }));
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
                if (config.level.enabledChannels.includes(channel.id)) return interaction.editReply(t('level.enabled_channels.already', { lng }));
                if (config.level.enabledChannels.length >= 25) return interaction.editReply(t('level.enabled_channels.limit', { lng }));
                await client.updateGuildSettings(guildId, { $push: { ['level.enabledChannels']: channel.id } });
                interaction.editReply(t('level.enabled_channels.added', { lng, channel: channel.toString() }));
              }
              break;
            case 'remove':
              {
                const channelId = options.getString('channel-id', true);
                if (!config.level.enabledChannels.includes(channelId)) return interaction.editReply(t('level.enabled_channels.invalid', { lng }));
                await client.updateGuildSettings(guildId, { $pull: { ['level.enabledChannels']: channelId } });
                interaction.editReply(t('level.enabled_channels.removed', { lng }));
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

                if (user.bot) return interaction.editReply(t('level.bot', { lng }));

                const xp = options.getInteger('xp', true);
                const userLevel = await addXP({ userId: user.id, guildId }, client, xp);
                const rewards = await getLevelRewards(client, userLevel);

                if (member && rewards.length) {
                  await member.roles
                    .add(rewards.map((reward) => reward.roleId))
                    .catch((error) => logger.debug({ error, userId: user.id }, 'Could not add role(s)'));
                }

                interaction.editReply(t('level.xp.added', { lng, user: user.toString(), xp, new_xp: userLevel.xp, new_level: userLevel.level }));
              }
              break;
            case 'remove':
              {
                const user = options.getUser('user', true);
                const member = guild.members.cache.get(user.id);

                if (user.bot) return interaction.editReply(t('level.bot', { lng }));

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
                    .catch((error) => logger.debug({ error, userId: user.id }, 'Could not set role(s)'));
                }

                interaction.editReply(t('level.xp.removed', { lng, user: user.toString(), xp, new_xp: userLevel.xp, new_level: userLevel.level }));
              }
              break;
            case 'set':
              {
                const user = options.getUser('user', true);
                const member = guild.members.cache.get(user.id);

                if (user.bot) return interaction.editReply(t('level.bot', { lng }));

                const xp = options.getInteger('xp', true);
                const userLevel = await setXP({ userId: user.id, guildId }, client, xp);
                const rewards = await getLevelRewards(client, userLevel);

                if (member && rewards.length) {
                  await member.roles
                    .add(rewards.map((reward) => reward.roleId))
                    .catch((error) => logger.debug({ error, userId: user.id }, 'Could not add role(s)'));
                }

                interaction.editReply(t('level.xp.set', { lng, user: user.toString(), xp, new_xp: userLevel.xp, new_level: userLevel.level }));
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

                if (user.bot) return interaction.editReply(t('level.bot', { lng }));

                const level = options.getInteger('level', true);
                const userLevel = await addLevel({ userId: user.id, guildId }, client, level);
                const rewards = await getLevelRewards(client, userLevel);

                if (member && rewards.length) {
                  await member.roles
                    .add(rewards.map((reward) => reward.roleId))
                    .catch((error) => logger.debug({ error, userId: user.id }, 'Could not add role(s)'));
                }

                interaction.editReply(t('level.level.added', { lng, user: user.toString(), level, new_xp: userLevel.xp, new_level: userLevel.level }));
              }
              break;
            case 'remove':
              {
                const user = options.getUser('user', true);
                const member = guild.members.cache.get(user.id);

                if (user.bot) return interaction.editReply(t('level.bot', { lng }));

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
                    .catch((error) => logger.debug({ error, userId: user.id }, 'Could not set role(s)'));
                }

                interaction.editReply(t('level.level.removed', { lng, user: user.toString(), level, new_xp: userLevel.xp, new_level: userLevel.level }));
              }
              break;
            case 'set':
              {
                const user = options.getUser('user', true);
                const member = guild.members.cache.get(user.id);

                if (user.bot) return interaction.editReply(t('level.bot', { lng }));

                const level = options.getInteger('level', true);
                const userLevel = await setLevel({ userId: user.id, guildId }, client, level);
                const rewards = await getLevelRewards(client, userLevel);

                if (member && rewards.length) {
                  await member.roles
                    .add(rewards.map((reward) => reward.roleId))
                    .catch((error) => logger.debug({ error, userId: user.id }, 'Could not add role(s)'));
                }

                interaction.editReply(t('level.level.set', { lng, user: user.toString(), new_xp: userLevel.xp, new_level: userLevel.level }));
              }
              break;
          }
        }
        break;
    }
  },
});

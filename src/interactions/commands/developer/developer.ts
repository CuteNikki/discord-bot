import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { Command, ModuleType } from 'classes/command';

import {
  getClientSettings,
  removeSupportBotInvite,
  removeSupportGuildId,
  removeSupportGuildInvite,
  updateSupportBotInvite,
  updateSupportGuildId,
  updateSupportGuildInvite
} from 'db/client';
import { addBadge, banUser, getBannedUsers, getUserData, removeBadge, unbanUser } from 'db/user';

import { BadgeType } from 'types/user';

import { keys } from 'constants/keys';

import { chunk } from 'utils/common';
import { logger } from 'utils/logger';
import { pagination } from 'utils/pagination';

export default new Command({
  module: ModuleType.Developer,
  cooldown: 0,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('config-developer')
    .setDescription('Only for bot staff/developers')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName('support-guild-id')
        .setDescription('Configure the support guild id')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('set')
            .setDescription('Sets the support guild id')
            .addStringOption((option) => option.setName('guild-id').setDescription('The guild id').setRequired(true))
        )
        .addSubcommand((subcommand) => subcommand.setName('remove').setDescription('Removes the support guild id'))
        .addSubcommand((subcommand) => subcommand.setName('show').setDescription('Shows the support guild id'))
    )
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName('support-invite-url')
        .setDescription('Configure the support invite url')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('set')
            .setDescription('Sets the support invite url')
            .addStringOption((option) => option.setName('invite-url').setDescription('The invite url').setRequired(true))
        )
        .addSubcommand((subcommand) => subcommand.setName('remove').setDescription('Removes the support invite url'))
        .addSubcommand((subcommand) => subcommand.setName('show').setDescription('Shows the support invite url'))
    )
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName('bot-invite-url')
        .setDescription('Configure the bot invite url')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('set')
            .setDescription('Sets the bot invite url')
            .addStringOption((option) => option.setName('invite-url').setDescription('The invite url').setRequired(true))
        )
        .addSubcommand((subcommand) => subcommand.setName('remove').setDescription('Removes the bot invite url'))
        .addSubcommand((subcommand) => subcommand.setName('show').setDescription('Shows the bot invite url'))
    )
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName('badges')
        .setDescription('Configure the badges of a user')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('add')
            .setDescription('Adds a badge to a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to add a badge to').setRequired(true))
            .addIntegerOption((option) =>
              option.setName('badge').setDescription('The badge to add').setRequired(true).addChoices(
                { name: 'translator', value: BadgeType.Translator },
                { name: 'bughunter', value: BadgeType.Bughunter },
                {
                  name: 'expert bughunter',
                  value: BadgeType.ExpertBughunter
                },
                { name: 'supporter', value: BadgeType.Supporter },
                { name: 'staff member', value: BadgeType.StaffMember },
                { name: 'developer', value: BadgeType.Developer }
              )
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('remove')
            .setDescription('Removes a badge from a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to remove a badge from').setRequired(true))
            .addIntegerOption((option) =>
              option.setName('badge').setDescription('The badge to remove').setRequired(true).addChoices(
                { name: 'translator', value: BadgeType.Translator },
                { name: 'bughunter', value: BadgeType.Bughunter },
                {
                  name: 'expert bughunter',
                  value: BadgeType.ExpertBughunter
                },
                { name: 'supporter', value: BadgeType.Supporter },
                { name: 'staff member', value: BadgeType.StaffMember },
                { name: 'developer', value: BadgeType.Developer }
              )
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('list')
            .setDescription('Lists all badges of a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to view badges of').setRequired(true))
        )
    )
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName('bans')
        .setDescription('Configures the banned users')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('add')
            .setDescription('Bans a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to ban').setRequired(true))
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('remove')
            .setDescription('Unban a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to unban').setRequired(true))
        )
        .addSubcommand((subcommand) => subcommand.setName('list').setDescription('Lists all banned users'))
    ),
  async execute({ interaction }) {
    await interaction.deferReply();
    const { options, user } = interaction;

    const userData = await getUserData(user.id);
    const badges = userData.badges.map((badge) => badge.id);

    switch (options.getSubcommandGroup()) {
      case 'support-guild-id':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id) && !badges.includes(BadgeType.Developer)) {
            await interaction.editReply('You are not a developer of this bot!');
            return;
          }

          const settings = await getClientSettings(keys.DISCORD_BOT_ID);

          switch (options.getSubcommand()) {
            case 'set':
              {
                const guildId = options.getString('guild-id', true);

                if (settings.support.guildId === guildId) {
                  await interaction.editReply('That is already the guild id');
                  return;
                }

                await updateSupportGuildId(keys.DISCORD_BOT_ID, guildId);
                await interaction.editReply('Guild id has been set');
              }
              break;
            case 'remove':
              {
                if (!settings.support.guildId) {
                  await interaction.editReply('There is no guild id to remove');
                  return;
                }

                await removeSupportGuildId(keys.DISCORD_BOT_ID);
                await interaction.editReply('Guild id has been removed');
              }
              break;
            case 'show':
              {
                await interaction.editReply(`Current guild id: ${settings.support.guildId}`);
              }
              break;
          }
        }
        break;
      case 'support-invite-url':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id) && !badges.includes(BadgeType.Developer)) {
            await interaction.editReply('You are not a developer of this bot!');
            return;
          }

          const settings = await getClientSettings(keys.DISCORD_BOT_ID);

          switch (options.getSubcommand()) {
            case 'set':
              {
                const inviteUrl = options.getString('invite-url', true);

                if (settings.support.guildInvite === inviteUrl) {
                  await interaction.editReply('That is already the invite url');
                  return;
                }

                await updateSupportGuildInvite(keys.DISCORD_BOT_ID, inviteUrl);
                await interaction.editReply('Invite url has been set');
              }
              break;
            case 'remove':
              {
                if (!settings.support.guildInvite) {
                  await interaction.editReply('There is no invite url to remove');
                  return;
                }

                await removeSupportGuildInvite(keys.DISCORD_BOT_ID);
                await interaction.editReply('Invite url has been removed');
              }
              break;
            case 'show':
              {
                await interaction.editReply(`Current invite url: ${settings.support.guildInvite}`);
              }
              break;
          }
        }
        break;
      case 'bot-invite-url':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id) && !badges.includes(BadgeType.Developer)) {
            await interaction.editReply('You are not a developer of this bot!');
            return;
          }

          const settings = await getClientSettings(keys.DISCORD_BOT_ID);

          switch (options.getSubcommand()) {
            case 'set':
              {
                const inviteUrl = options.getString('invite-url', true);

                if (settings.support.botInvite === inviteUrl) {
                  await interaction.editReply('That is already the invite url');
                  return;
                }

                await updateSupportBotInvite(keys.DISCORD_BOT_ID, inviteUrl);
                await interaction.editReply('Invite url has been set');
              }
              break;
            case 'remove':
              {
                if (!settings.support.botInvite) {
                  await interaction.editReply('There is no invite url to remove');
                  return;
                }

                await removeSupportBotInvite(keys.DISCORD_BOT_ID);
                await interaction.editReply('Invite url has been removed');
              }
              break;
            case 'show':
              {
                await interaction.editReply(`Current invite url: ${settings.support.botInvite}`);
              }
              break;
          }
        }
        break;
      case 'badges':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id) && !badges.includes(BadgeType.Developer)) {
            await interaction.editReply('You are not a developer of this bot!');
            return;
          }

          switch (options.getSubcommand()) {
            case 'add':
              {
                const target = options.getUser('user', true);
                const badge = options.getInteger('badge', true);

                const targetData = await getUserData(target.id);

                if (targetData.badges.map((badge) => badge.id).includes(badge)) {
                  await interaction.editReply('User already has that badge!');
                  return;
                }

                await addBadge(target.id, badge);

                const msg = await target
                  .send(`You have received the ${BadgeType[badge]} badge!`)
                  .catch((err) => logger.debug({ err, targetId: target.id }, 'Could not send user a DM'));

                await interaction.editReply(`User has received the ${BadgeType[badge]} badge\n${msg ? 'Sent a DM to the user' : ''}`);
              }
              break;
            case 'remove':
              {
                const target = options.getUser('user', true);
                const badge = options.getInteger('badge', true);

                const targetData = await getUserData(target.id);

                if (!targetData.badges.map((badge) => badge.id).includes(badge)) {
                  await interaction.editReply('User does not have that badge!');
                  return;
                }

                await removeBadge(target.id, badge);

                const msg = await target
                  .send(`Your ${BadgeType[badge]} badge has been removed!`)
                  .catch((err) => logger.debug({ err, targetId: target.id }, 'Could not send user a DM'));

                await interaction.editReply(`${BadgeType[badge]} badge has been removed from user${msg ? '\nSent a DM to the user' : ''}`);
              }
              break;
            case 'list':
              {
                const target = options.getUser('user', true);

                const targetData = await getUserData(target.id);

                await interaction.editReply(
                  `Badges:\n${targetData.badges.map((badge) => `${BadgeType[badge.id]}: <t:${Math.floor(badge.receivedAt / 1000)}:f>`).join('\n')}`
                );
              }
              break;
          }
        }
        break;
      case 'bans':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id) && !badges.includes(BadgeType.Developer) && !badges.includes(BadgeType.StaffMember)) {
            await interaction.editReply('You are not a staff member or developer of this bot!');
            return;
          }

          switch (options.getSubcommand()) {
            case 'add':
              {
                const target = options.getUser('user', true);

                const targetSettings = await getUserData(target.id);

                if (targetSettings.banned) {
                  await interaction.editReply('User is already banned!');
                  return;
                }

                await banUser(target.id);

                const msg = await target
                  .send('You have been banned. You can no longer use this bot.')
                  .catch((err) => logger.debug({ err, targetId: target.id }, 'Could not send user a DM'));

                await interaction.editReply('User has been banned' + (msg ? '\nSent a DM to the user' : ''));
              }
              break;
            case 'remove':
              {
                const target = options.getUser('user', true);

                const targetSettings = await getUserData(target.id);

                if (!targetSettings.banned) {
                  await interaction.editReply('User is not banned!');
                  return;
                }

                await unbanUser(target.id);

                const msg = await target
                  .send('You have been unbanned. You can use this bot again.')
                  .catch((err) => logger.debug({ err, targetId: target.id }, 'Could not send user a DM'));

                await interaction.editReply('User has been unbanned' + (msg ? '\nSent a DM to the user' : ''));
              }
              break;
            case 'list':
              {
                const bannedUsers = await getBannedUsers();
                const chunkedUsers = chunk(bannedUsers, 10);

                await pagination({
                  interaction,
                  embeds: chunkedUsers.map((chunk) =>
                    new EmbedBuilder()
                      .setColor(Colors.Aqua)
                      .setTitle(`Banned Users`)
                      .setDescription(chunk.map((user) => `<@${user.userId}> (${user.userId})`).join('\n\n') || '/')
                  )
                });
              }
              break;
          }
        }
        break;
    }
  }
});

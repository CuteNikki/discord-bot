import {
  ApplicationIntegrationType,
  AttachmentBuilder,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
  time,
  TimestampStyles
} from 'discord.js';

import { Command } from 'classes/command';

import {
  getClientSettings,
  removeSupportBotInvite,
  removeSupportGuildId,
  removeSupportGuildInvite,
  updateSupportBotInvite,
  updateSupportGuildId,
  updateSupportGuildInvite
} from 'db/client';
import { getGuildExport } from 'db/guild';
import { addBadge, addBank, addWallet, banUser, getBannedUsers, getUser, getUserExport, removeBadge, removeBank, removeWallet, unbanUser } from 'db/user';

import { BadgeType } from 'types/user';

import { keys } from 'constants/keys';

import { chunk } from 'utils/common';
import { logger } from 'utils/logger';
import { pagination } from 'utils/pagination';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Developer,
  cooldown: 0,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('config-developer')
    .setDescription('Only for bot staff/developers')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
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
        .setName('balance-bank')
        .setDescription('Manage the bank balance of a user')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('add')
            .setDescription('Adds money to a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to add money to').setRequired(true))
            .addIntegerOption((option) => option.setName('amount').setDescription('The amount of money to add').setRequired(true))
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('remove')
            .setDescription('Removes money from a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to remove money from').setRequired(true))
            .addIntegerOption((option) => option.setName('amount').setDescription('The amount of money to remove').setRequired(true))
        )
    )
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName('balance-wallet')
        .setDescription('Manage the wallet balance of a user')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('add')
            .setDescription('Adds money to a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to add money to').setRequired(true))
            .addIntegerOption((option) => option.setName('amount').setDescription('The amount of money to add').setRequired(true))
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('remove')
            .setDescription('Removes money from a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to remove money from').setRequired(true))
            .addIntegerOption((option) => option.setName('amount').setDescription('The amount of money to remove').setRequired(true))
        )
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
              option
                .setName('badge')
                .setDescription('The badge to add')
                .setRequired(true)
                .setChoices(
                  Object.entries(BadgeType)
                    .filter(([, value]) => typeof value === 'number')
                    .map(([key, value]) => ({ name: key.toLowerCase(), value })) as { name: string; value: number }[]
                )
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('remove')
            .setDescription('Removes a badge from a user')
            .addUserOption((option) => option.setName('user').setDescription('The user to remove a badge from').setRequired(true))
            .addIntegerOption((option) =>
              option
                .setName('badge')
                .setDescription('The badge to remove')
                .setRequired(true)
                .setChoices(
                  Object.entries(BadgeType)
                    .filter(([, value]) => typeof value === 'number')
                    .map(([key, value]) => ({ name: key.toLowerCase(), value })) as { name: string; value: number }[]
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
    )
    .addSubcommandGroup((group) =>
      group
        .setName('export-data')
        .setDescription('Shows all stored data')
        .addSubcommand((cmd) =>
          cmd
            .setName('user')
            .setDescription('Shows all data of a user')
            .addStringOption((option) => option.setName('user-id').setDescription('The id of the user to show data of').setRequired(true))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('guild')
            .setDescription('Shows all data of a guild')
            .addStringOption((option) => option.setName('guild-id').setDescription('The guild to show data of').setRequired(true))
        )
    ),
  async execute({ interaction, client }) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const { options, user } = interaction;

    const userData = (await getUser(user.id)) ?? { badges: [] };
    const badges = userData.badges.map((badge) => badge.id);

    switch (options.getSubcommandGroup()) {
      case 'support-guild-id':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id) && !badges.includes(BadgeType.Developer)) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('You are not a developer of this bot!')]
            });
            return;
          }

          const settings = (await getClientSettings(keys.DISCORD_BOT_ID)) ?? { support: { guildId: null } };

          switch (options.getSubcommand()) {
            case 'set':
              {
                const guildId = options.getString('guild-id', true);

                if (settings.support.guildId === guildId) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('That is already the guild id')]
                  });
                  return;
                }

                await updateSupportGuildId(keys.DISCORD_BOT_ID, guildId);
                await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.developer).setDescription('Guild id has been set')] });
              }
              break;
            case 'remove':
              {
                if (!settings.support.guildId) {
                  await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('There is no guild id to remove')] });
                  return;
                }

                await removeSupportGuildId(keys.DISCORD_BOT_ID);
                await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.developer).setDescription('Guild id has been removed')] });
              }
              break;
            case 'show':
              {
                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.developer).setDescription(`Current guild id: ${settings.support.guildId}`)]
                });
              }
              break;
          }
        }
        break;
      case 'support-invite-url':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id) && !badges.includes(BadgeType.Developer)) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('You are not a developer of this bot!')] });
            return;
          }

          const settings = (await getClientSettings(keys.DISCORD_BOT_ID)) ?? { support: { guildInvite: null } };

          switch (options.getSubcommand()) {
            case 'set':
              {
                const inviteUrl = options.getString('invite-url', true);

                if (settings.support.guildInvite === inviteUrl) {
                  await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('That is already the invite url')] });
                  return;
                }

                await updateSupportGuildInvite(keys.DISCORD_BOT_ID, inviteUrl);
                await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.developer).setDescription('Invite url has been set')] });
              }
              break;
            case 'remove':
              {
                if (!settings.support.guildInvite) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('There is no invite url to remove')]
                  });
                  return;
                }

                await removeSupportGuildInvite(keys.DISCORD_BOT_ID);
                await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.developer).setDescription('Invite url has been removed')] });
              }
              break;
            case 'show':
              {
                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.developer).setDescription(`Current invite url: ${settings.support.guildInvite}`)]
                });
              }
              break;
          }
        }
        break;
      case 'bot-invite-url':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id) && !badges.includes(BadgeType.Developer)) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('You are not a developer of this bot!')] });
            return;
          }

          const settings = (await getClientSettings(keys.DISCORD_BOT_ID)) ?? { support: { botInvite: null } };

          switch (options.getSubcommand()) {
            case 'set':
              {
                const inviteUrl = options.getString('invite-url', true);

                if (settings.support.botInvite === inviteUrl) {
                  await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('That is already the invite url')] });
                  return;
                }

                await updateSupportBotInvite(keys.DISCORD_BOT_ID, inviteUrl);
                await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.developer).setDescription('Invite url has been set')] });
              }
              break;
            case 'remove':
              {
                if (!settings.support.botInvite) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('There is no invite url to remove')]
                  });
                  return;
                }

                await removeSupportBotInvite(keys.DISCORD_BOT_ID);
                await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.developer).setDescription('Invite url has been removed')] });
              }
              break;
            case 'show':
              {
                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.developer).setDescription(`Current invite url: ${settings.support.botInvite}`)]
                });
              }
              break;
          }
        }
        break;
      case 'balance-bank':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id) && !badges.includes(BadgeType.Developer)) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('You are not a developer of this bot!')] });
            return;
          }

          switch (options.getSubcommand()) {
            case 'add':
              {
                const target = options.getUser('user', true);
                const amount = options.getInteger('amount', true);

                if (target.bot) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('You cannot add money to a bot!')]
                  });
                  return;
                }

                await addBank(target.id, amount);

                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.developer)
                      .setDescription(
                        `Successfully added ${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)} to ${target.toString()} bank balance`
                      )
                  ]
                });
              }
              break;
            case 'remove':
              {
                const target = options.getUser('user', true);
                const amount = options.getInteger('amount', true);

                if (target.bot) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('You cannot remove money from a bot!')]
                  });
                  return;
                }

                const targetData = (await getUser(target.id)) ?? { bank: 0 };

                if (targetData.bank < amount) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('User does not have enough money in bank!')]
                  });
                  return;
                }

                await removeBank(target.id, amount);

                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.developer)
                      .setDescription(
                        `Successfully removed ${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)} from ${target.toString()} bank balance!`
                      )
                  ]
                });
              }
              break;
          }
        }
        break;
      case 'balance-wallet':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id) && !badges.includes(BadgeType.Developer)) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('You are not a developer of this bot!')] });
            return;
          }

          switch (options.getSubcommand()) {
            case 'add':
              {
                const target = options.getUser('user', true);
                const amount = options.getInteger('amount', true);

                if (target.bot) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('You cannot add money to a bot!')]
                  });
                  return;
                }

                await addWallet(target.id, amount);

                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.developer)
                      .setDescription(
                        `Successfully added ${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)} to ${target.toString()} wallet balance!`
                      )
                  ]
                });
              }
              break;
            case 'remove':
              {
                const target = options.getUser('user', true);
                const amount = options.getInteger('amount', true);

                if (target.bot) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('You cannot remove money from a bot!')]
                  });
                  return;
                }

                const targetData = (await getUser(target.id)) ?? { wallet: 0 };

                if (targetData.wallet < amount) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('User does not have enough money in wallet!')]
                  });
                  return;
                }

                await removeWallet(target.id, amount);

                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.developer)
                      .setDescription(
                        `Successfully removed ${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)} from ${target.toString()} wallet balance!`
                      )
                  ]
                });
              }
              break;
          }
        }
        break;
      case 'badges':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id) && !badges.includes(BadgeType.Developer)) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('You are not a developer of this bot!')] });
            return;
          }

          switch (options.getSubcommand()) {
            case 'add':
              {
                const target = options.getUser('user', true);
                const badge = options.getInteger('badge', true);

                const targetData = (await getUser(target.id)) ?? { badges: [] };

                if (targetData.badges.map((badge) => badge.id).includes(badge)) {
                  await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('User already has that badge!')] });
                  return;
                }

                await addBadge(target.id, badge);

                const msg = await target
                  .send({
                    embeds: [
                      new EmbedBuilder()
                        .setColor(client.colors.developer)
                        .setDescription(`You have received the ${BadgeType[badge]} badge by ${user.username}!`)
                    ]
                  })
                  .catch((err) => logger.debug({ err, targetId: target.id }, 'Could not send user a DM'));

                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.developer)
                      .setDescription(`User has received the ${BadgeType[badge]} badge\n${msg ? 'Sent a DM to the user' : ''}`)
                  ]
                });
              }
              break;
            case 'remove':
              {
                const target = options.getUser('user', true);
                const badge = options.getInteger('badge', true);

                const targetData = (await getUser(target.id)) ?? { badges: [] };

                if (!targetData.badges.map((badge) => badge.id).includes(badge)) {
                  await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('User does not have that badge!')] });
                  return;
                }

                await removeBadge(target.id, badge);

                const msg = await target
                  .send({
                    embeds: [
                      new EmbedBuilder()
                        .setColor(client.colors.developer)
                        .setDescription(`Your ${BadgeType[badge]} badge has been removed by ${user.username}!`)
                    ]
                  })
                  .catch((err) => logger.debug({ err, targetId: target.id }, 'Could not send user a DM'));

                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(client.colors.developer)
                      .setDescription(`${BadgeType[badge]} badge has been removed from user${msg ? '\nSent a DM to the user' : ''}`)
                  ]
                });
              }
              break;
            case 'list':
              {
                const target = options.getUser('user', true);

                const targetData = (await getUser(target.id)) ?? { badges: [] };

                await interaction.editReply(
                  `Badges:\n${targetData.badges.map((badge) => `${BadgeType[badge.id]}: ${time(Math.floor(badge.receivedAt / 1000), TimestampStyles.ShortDateTime)}`).join('\n')}`
                );
              }
              break;
          }
        }
        break;
      case 'bans':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id) && !badges.includes(BadgeType.Developer) && !badges.includes(BadgeType.StaffMember)) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('You are not a staff member or developer of this bot!')]
            });
            return;
          }

          switch (options.getSubcommand()) {
            case 'add':
              {
                const target = options.getUser('user', true);

                const targetSettings = (await getUser(target.id)) ?? { banned: false };

                if (targetSettings.banned) {
                  await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('User is already banned!')] });
                  return;
                }

                await banUser(target.id);

                const msg = await target
                  .send({
                    embeds: [new EmbedBuilder().setColor(client.colors.developer).setDescription('You have been banned. You can no longer use this bot.')]
                  })
                  .catch((err) => logger.debug({ err, targetId: target.id }, 'Could not send user a DM'));

                await interaction.editReply({
                  embeds: [new EmbedBuilder().setColor(client.colors.developer).setDescription('User has been banned' + (msg ? '\nSent a DM to the user' : ''))]
                });
              }
              break;
            case 'remove':
              {
                const target = options.getUser('user', true);

                const targetSettings = (await getUser(target.id)) ?? { banned: false };

                if (!targetSettings.banned) {
                  await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('User is not banned!')] });
                  return;
                }

                await unbanUser(target.id);

                const msg = await target
                  .send({
                    embeds: [new EmbedBuilder().setColor(client.colors.developer).setDescription('You have been unbanned. You can use this bot again.')]
                  })
                  .catch((err) => logger.debug({ err, targetId: target.id }, 'Could not send user a DM'));

                await interaction.editReply({
                  embeds: [
                    new EmbedBuilder().setColor(client.colors.developer).setDescription('User has been unbanned' + (msg ? '\nSent a DM to the user' : ''))
                  ]
                });
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
                      .setColor(client.colors.developer)
                      .setDescription(chunk.map((user) => `<@${user.userId}> (${user.userId})`).join('\n\n') || '/')
                  )
                });
              }
              break;
          }
        }
        break;
      case 'export-data':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id) && !badges.includes(BadgeType.Developer)) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('You are not a developer of this bot!')]
            });
            return;
          }

          switch (options.getSubcommand()) {
            case 'user':
              {
                const userId = interaction.options.getString('user-id', true);

                const userData = await getUserExport(userId);

                if (!userData) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('Could not find any data for that user!')]
                  });
                  return;
                }

                await interaction.editReply({
                  files: [
                    new AttachmentBuilder(Buffer.from(JSON.stringify(userData, null, 2)), {
                      name: 'user-data.json',
                      description: 'User data'
                    })
                  ]
                });
              }
              break;
            case 'guild':
              {
                const guildId = interaction.options.getString('guild-id', true);

                const guildData = await getGuildExport(guildId);

                if (!guildData) {
                  await interaction.editReply({
                    embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('Could not find any data for that guild!')]
                  });
                  return;
                }

                await interaction.editReply({
                  files: [
                    new AttachmentBuilder(Buffer.from(JSON.stringify(guildData, null, 2)), {
                      name: 'guild-data.json',
                      description: 'Guild data'
                    })
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

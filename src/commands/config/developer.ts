import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { Command, ModuleType } from 'classes/command';

import { BadgeType, userModel } from 'models/user';

import { keys } from 'utils/keys';
import { chunk, pagination } from 'utils/pagination';

export default new Command({
  module: ModuleType.Developer,
  cooldown: 0,
  data: new SlashCommandBuilder()
    .setName('config-developer')
    .setDescription('Only for bot moderators/developers')
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
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
              option
                .setName('badge')
                .setDescription('The badge to add')
                .setRequired(true)
                .addChoices(
                  { name: 'translator', value: BadgeType.Translator },
                  { name: 'bughunter', value: BadgeType.Bughunter },
                  { name: 'expert bughunter', value: BadgeType.ExpertBughunter },
                  { name: 'supporter', value: BadgeType.Supporter },
                  { name: 'moderator', value: BadgeType.Moderator },
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
              option
                .setName('badge')
                .setDescription('The badge to remove')
                .setRequired(true)
                .addChoices(
                  { name: 'translator', value: BadgeType.Translator },
                  { name: 'bughunter', value: BadgeType.Bughunter },
                  { name: 'expert bughunter', value: BadgeType.ExpertBughunter },
                  { name: 'supporter', value: BadgeType.Supporter },
                  { name: 'moderator', value: BadgeType.Moderator },
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
  async execute({ client, interaction }) {
    await interaction.deferReply();
    const { options, user } = interaction;

    const userData = await client.getUserData(user.id);
    const badges = userData.badges.map((badge) => badge.id);

    switch (options.getSubcommandGroup()) {
      case 'support-guild-id':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id)) {
            if (!badges.includes(BadgeType.Developer)) return interaction.editReply('You are not a developer of this bot!');
          }

          const settings = await client.getClientSettings(keys.DISCORD_BOT_ID);

          switch (options.getSubcommand()) {
            case 'set':
              {
                const guildId = options.getString('guild-id', true);
                if (settings.support.guildId === guildId) return interaction.editReply('That is already the guild id');
                await client.updateClientSettings(keys.DISCORD_BOT_ID, { $set: { ['support.guildId']: guildId } });
                interaction.editReply('Guild id has been set');
              }
              break;
            case 'remove':
              {
                if (settings.support.guildId === 'unavailable') return interaction.editReply('There is no guild id to remove');
                await client.updateClientSettings(keys.DISCORD_BOT_ID, { $set: { ['support.guildId']: 'unavailable' } });
                interaction.editReply('Guild id has been removed');
              }
              break;
            case 'show':
              {
                interaction.editReply(`Current guild id: ${settings.support.guildId}`);
              }
              break;
          }
        }
        break;
      case 'support-invite-url':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id)) {
            if (!badges.includes(BadgeType.Developer)) return interaction.editReply('You are not a developer of this bot!');
          }

          const settings = await client.getClientSettings(keys.DISCORD_BOT_ID);

          switch (options.getSubcommand()) {
            case 'set':
              {
                const inviteUrl = options.getString('invite-url', true);
                if (settings.support.inviteUrl === inviteUrl) return interaction.editReply('That is already the invite url');
                await client.updateClientSettings(keys.DISCORD_BOT_ID, { $set: { ['support.inviteUrl']: inviteUrl } });
                interaction.editReply('Invite url has been set');
              }
              break;
            case 'remove':
              {
                if (settings.support.inviteUrl === 'unavailable') return interaction.editReply('There is no invite url to remove');
                await client.updateClientSettings(keys.DISCORD_BOT_ID, { $set: { ['support.inviteUrl']: 'unavailable' } });
                interaction.editReply('Invite url has been removed');
              }
              break;
            case 'show':
              {
                interaction.editReply(`Current invite url: ${settings.support.inviteUrl}`);
              }
              break;
          }
        }
        break;
      case 'bot-invite-url':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id)) {
            if (!badges.includes(BadgeType.Developer)) return interaction.editReply('You are not a developer of this bot!');
          }

          const settings = await client.getClientSettings(keys.DISCORD_BOT_ID);

          switch (options.getSubcommand()) {
            case 'set':
              {
                const inviteUrl = options.getString('invite-url', true);
                if (settings.inviteUrl === inviteUrl) return interaction.editReply('That is already the invite url');
                await client.updateClientSettings(keys.DISCORD_BOT_ID, { $set: { inviteUrl: inviteUrl } });
                interaction.editReply('Invite url has been set');
              }
              break;
            case 'remove':
              {
                if (settings.inviteUrl === 'unavailable') return interaction.editReply('There is no invite url to remove');
                await client.updateClientSettings(keys.DISCORD_BOT_ID, { $set: { inviteUrl: 'unavailable' } });
                interaction.editReply('Invite url has been removed');
              }
              break;
            case 'show':
              {
                interaction.editReply(`Current invite url: ${settings.inviteUrl}`);
              }
              break;
          }
        }
        break;
      case 'badges':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id)) {
            if (!badges.includes(BadgeType.Developer)) return interaction.editReply('You are not a developer of this bot!');
          }

          switch (options.getSubcommand()) {
            case 'add':
              {
                const target = options.getUser('user', true);
                const badge = options.getInteger('badge', true);
                const targetData = await client.getUserData(target.id);
                if (targetData.badges.map((badge) => badge.id).includes(badge)) return interaction.editReply('User already has that badge!');
                await client.updateUserData(target.id, { $push: { badges: { id: badge, receivedAt: Date.now() } } });
                await target.send(`You have received the ${BadgeType[badge]} badge!`).catch(() => {});
                interaction.editReply(`User has received the ${BadgeType[badge]} badge`);
              }
              break;
            case 'remove':
              {
                const target = options.getUser('user', true);
                const badge = options.getInteger('badge', true);
                const targetData = await client.getUserData(target.id);
                if (!targetData.badges.map((badge) => badge.id).includes(badge)) return interaction.editReply('User does not have that badge!');
                await client.updateUserData(target.id, { $pull: { badges: { id: badge } } });
                await target.send(`Your ${BadgeType[badge]} badge has been removed!`).catch(() => {});
                interaction.editReply(`${BadgeType[badge]} badge has been removed from user`);
              }
              break;
            case 'list':
              {
                const target = options.getUser('user', true);
                const targetData = await client.getUserData(target.id);
                interaction.editReply(
                  `Badges:\n${targetData.badges.map((badge) => `${BadgeType[badge.id]}: <t:${Math.floor(badge.receivedAt / 1000)}:f>`).join('\n')}`
                );
              }
              break;
          }
        }
        break;
      case 'bans':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id)) {
            if (!badges.includes(BadgeType.Moderator) || !badges.includes(BadgeType.Developer))
              return interaction.editReply('You are not a moderator or developer of this bot!');
          }

          switch (options.getSubcommand()) {
            case 'add':
              {
                const target = options.getUser('user', true);
                const targetSettings = await client.getUserData(target.id);
                if (targetSettings.banned) return interaction.editReply('User is already banned!');
                await client.updateUserData(target.id, { $set: { banned: true } });
                await target.send('You have been banned. You can no longer use this bot.').catch(() => {});
                interaction.editReply('User has been banned');
              }
              break;
            case 'remove':
              {
                const target = options.getUser('user', true);
                const targetSettings = await client.getUserData(target.id);
                if (!targetSettings.banned) return interaction.editReply('User is not banned!');
                await client.updateUserData(target.id, { $set: { banned: false } });
                await target.send('You have been unbanned. You can use this bot again.').catch(() => {});
                interaction.editReply('User has been unbanned');
              }
              break;
            case 'list':
              {
                const bannedUsers = await userModel.find({ banned: true }).lean().exec();

                const chunkedUsers = chunk(bannedUsers, 10);
                await pagination({
                  client,
                  interaction,
                  embeds: chunkedUsers.map((chunk, index) =>
                    new EmbedBuilder()
                      .setColor(Colors.Aqua)
                      .setTitle(`Banned Users (Page ${index + 1}/${chunkedUsers.length})`)
                      .setDescription(chunk.map((user) => `<@${user.userId}> (${user.userId})`).join('\n\n') || '/')
                  ),
                });
              }
              break;
          }
        }
        break;
    }
  },
});

import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';

import { BadgeType, userModel } from 'models/user';

import { keys } from 'utils/keys';
import { chunk, pagination } from 'utils/pagination';

export default new Command({
  module: Modules.DEVELOPER,
  cooldown: 0,
  data: {
    name: 'config-bot',
    description: 'Only for bot moderators/developers',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD, Contexts.BOT_DM, Contexts.PRIVATE_CHANNEL],
    integration_types: [IntegrationTypes.GUILD_INSTALL, IntegrationTypes.USER_INSTALL],
    options: [
      {
        name: 'badges',
        description: 'Configure the badges of a user',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'add',
            description: 'Adds a badge to a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to add a badge to',
                type: ApplicationCommandOptionType.User,
                required: true,
              },
              {
                name: 'badge',
                description: 'The badge to add',
                type: ApplicationCommandOptionType.Integer,
                choices: [
                  { name: 'translator', value: BadgeType.TRANSLATOR },
                  { name: 'bughunter', value: BadgeType.BUGHUNTER },
                  { name: 'expert bughunter', value: BadgeType.EXPERT_BUGHUNTER },
                  { name: 'supporter', value: BadgeType.SUPPORTER },
                  { name: 'moderator', value: BadgeType.MODERATOR },
                  { name: 'developer', value: BadgeType.DEVELOPER },
                ],
                required: true,
              },
            ],
          },
          {
            name: 'remove',
            description: 'Removes a badge from a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to remove a badge from',
                type: ApplicationCommandOptionType.User,
                required: true,
              },
              {
                name: 'badge',
                description: 'The badge to remove',
                type: ApplicationCommandOptionType.Integer,
                choices: [
                  { name: 'translator', value: BadgeType.TRANSLATOR },
                  { name: 'bughunter', value: BadgeType.BUGHUNTER },
                  { name: 'expert bughunter', value: BadgeType.EXPERT_BUGHUNTER },
                  { name: 'supporter', value: BadgeType.SUPPORTER },
                  { name: 'moderator', value: BadgeType.MODERATOR },
                  { name: 'developer', value: BadgeType.DEVELOPER },
                ],
                required: true,
              },
            ],
          },
          {
            name: 'list',
            description: 'Lists all badges of a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to view badges of',
                type: ApplicationCommandOptionType.User,
                required: true,
              },
            ],
          },
        ],
      },
      {
        name: 'bans',
        description: 'Configures the banned users',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'add',
            description: 'Bans a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to ban',
                type: ApplicationCommandOptionType.User,
                required: true,
              },
            ],
          },
          {
            name: 'remove',
            description: 'Unban a user',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'user',
                description: 'The user to unban',
                type: ApplicationCommandOptionType.User,
                required: true,
              },
            ],
          },
          {
            name: 'list',
            description: 'Lists all banned users',
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
    ],
  },
  async execute({ client, interaction }) {
    await interaction.deferReply();
    const { options, user } = interaction;

    const userData = await client.getUserData(user.id);
    const badges = userData.badges.map((badge) => badge.id);

    switch (options.getSubcommandGroup()) {
      case 'badges':
        {
          if (!keys.DEVELOPER_USER_IDS.includes(user.id)) {
            if (!badges.includes(BadgeType.DEVELOPER)) return interaction.editReply('You are not a developer of this bot!');
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
            if (!badges.includes(BadgeType.MODERATOR) || !badges.includes(BadgeType.DEVELOPER))
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

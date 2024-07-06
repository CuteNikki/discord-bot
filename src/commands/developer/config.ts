import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder, PermissionFlagsBits } from 'discord.js';

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';
import { userModel } from '../../models/user';
import { chunk, pagination } from '../../utilities/pagination';

export default new Command({
  module: Modules.DEVELOPER,
  developerOnly: true,
  cooldown: 0,
  data: {
    name: 'config',
    description: 'Configures the bot',
    default_member_permissions: `${PermissionFlagsBits.Administrator}`,
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
    options: [
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
    const { options } = interaction;

    switch (options.getSubcommandGroup()) {
      case 'bans':
        {
          switch (options.getSubcommand()) {
            case 'add':
              {
                const user = options.getUser('user', true);
                const userSettings = await client.getUserSettings(user.id);
                if (userSettings.banned) return interaction.editReply('User is already banned!');
                const settings = await userModel.findOneAndUpdate({ userId: user.id }, { banned: true }, { new: true, upsert: true });
                client.userSettings.set(user.id, settings);
                await user.send('You have been banned. You can no longer use this bot.').catch(() => {});
                interaction.editReply('User has been banned');
              }
              break;
            case 'remove':
              {
                const user = options.getUser('user', true);
                const userSettings = await client.getUserSettings(user.id);
                if (!userSettings.banned) return interaction.editReply('User is not banned!');
                const settings = await userModel.findOneAndUpdate({ userId: user.id }, { banned: false }, { new: true, upsert: true });
                client.userSettings.set(user.id, settings);
                await user.send('You have been unbanned. You can use this bot again.').catch(() => {});
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

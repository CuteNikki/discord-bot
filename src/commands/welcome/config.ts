import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, EmbedBuilder, PermissionFlagsBits, type APIEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

import { CustomEmbedBuilder } from 'utils/embed';

import type { Message } from 'models/guild';

export default new Command({
  module: ModuleType.Config,
  data: {
    name: 'config-welcome',
    description: 'Configure the welcome module',
    default_member_permissions: `${PermissionFlagsBits.ManageGuild}`,
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.Guild],
    integration_types: [IntegrationTypes.GuildInstall],
    options: [
      {
        name: 'roles',
        description: 'Configure the join roles',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'add',
            description: 'Adds a join role to the list',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'role',
                description: 'The role to add',
                type: ApplicationCommandOptionType.Role,
                required: true,
              },
            ],
          },
          {
            name: 'remove',
            description: 'Removes a join role from the list',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'role-id',
                description: 'The role to remove',
                type: ApplicationCommandOptionType.String,
                required: true,
              },
            ],
          },
          {
            name: 'list',
            description: 'Shows all the current join roles',
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
      {
        name: 'channel',
        description: 'Configure the join channel',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'set',
            description: 'Sets the join channel',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'channel',
                description: 'The channel to set it to',
                type: ApplicationCommandOptionType.Channel,
                channel_types: [ChannelType.GuildText],
                required: true,
              },
            ],
          },
          {
            name: 'remove',
            description: 'Removes the join channel',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'show',
            description: 'Shows the current join channel',
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
      {
        name: 'message',
        description: 'Configure the join message',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'set',
            description: 'Sets the join message',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'remove',
            description: 'Removes the join message',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'show',
            description: 'Shows the current join message',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'test',
            description: 'Emits the join event to test welcome messages',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'placeholders',
            description: 'Shows you all available placeholders',
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
    ],
  },
  async execute({ client, interaction }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply({ ephemeral: true });

    const { options, user, guild } = interaction;
    const lng = await client.getUserLanguage(user.id);

    const settings = await client.getGuildSettings(guild.id);

    switch (options.getSubcommandGroup()) {
      case 'roles':
        {
          switch (options.getSubcommand()) {
            case 'add':
              {
                const role = options.getRole('role', true);
                if (settings.welcome.roles.includes(role.id)) return interaction.editReply(i18next.t('welcome.roles.already', { lng }));
                await client.updateGuildSettings(guild.id, { $push: { ['welcome.roles']: role.id } });
                await interaction.editReply(i18next.t('welcome.roles.added', { lng }));
              }
              break;
            case 'remove':
              {
                const roleId = options.getString('role-id', true);
                if (!settings.welcome.roles.includes(roleId)) return interaction.editReply(i18next.t('welcome.roles.invalid', { lng }));
                await client.updateGuildSettings(guild.id, { $pull: { ['welcome.roles']: roleId } });
                await interaction.editReply(i18next.t('welcome.roles.removed', { lng }));
              }
              break;
            case 'list':
              {
                if (!settings.welcome.roles.length) return interaction.editReply(i18next.t('welcome.roles.none', { lng }));
                await interaction.editReply(`${i18next.t('welcome.roles.list', { lng })}\n\n${settings.welcome.roles.map((role) => `<@&${role}>`).join(', ')}`);
              }
              break;
          }
        }
        break;
      case 'channel':
        {
          switch (options.getSubcommand()) {
            case 'set':
              {
                const channel = options.getChannel('channel', true, [ChannelType.GuildText]);
                if (settings.welcome.channelId === channel.id) return interaction.editReply(i18next.t('welcome.channel.already', { lng }));
                await client.updateGuildSettings(guild.id, { $set: { ['welcome.channelId']: channel.id } });
                await interaction.editReply(i18next.t('welcome.channel.set', { lng }));
              }
              break;
            case 'remove':
              {
                if (!settings.welcome.channelId) return interaction.editReply(i18next.t('welcome.channel.invalid', { lng }));
                await client.updateGuildSettings(guild.id, { $set: { ['welcome.channelId']: undefined } });
                await interaction.editReply(i18next.t('welcome.channel.removed', { lng }));
              }
              break;
            case 'show':
              {
                if (!settings.welcome.channelId) return interaction.editReply(i18next.t('welcome.channel.none', { lng }));
                await interaction.editReply(i18next.t('welcome.channel.show', { lng, channel: `<#${settings.welcome.channelId}>` }));
              }
              break;
          }
        }
        break;
      case 'message':
        {
          switch (options.getSubcommand()) {
            case 'set':
              {
                const customBuilder = new CustomEmbedBuilder({ client, interaction, data: settings.welcome.message });
                customBuilder.once('submit', async (data: Message) => {
                  await client.updateGuildSettings(guild.id, { $set: { ['welcome.message']: data } });
                  interaction.editReply({ content: i18next.t('welcome.message.set', { lng }), embeds: [], components: [] }).catch(() => {});
                });
              }
              break;
            case 'remove':
              {
                await client.updateGuildSettings(guild.id, {
                  $set: {
                    ['welcome.message']: {
                      content: null,
                      embed: {
                        color: null,
                        description: null,
                        image: undefined,
                        thumbnail: undefined,
                        title: null,
                        url: null,
                        author: {
                          name: null,
                          icon_url: null,
                          url: null,
                        },
                        footer: {
                          text: null,
                          icon_url: null,
                        },
                        fields: [],
                      },
                    },
                  },
                });
                interaction.editReply(i18next.t('welcome.message.removed', { lng })).catch(() => {});
              }
              break;
            case 'show':
              {
                await interaction.editReply({
                  content: settings.welcome.message.content,
                  embeds: [EmbedBuilder.from(settings.welcome.message.embed as APIEmbed)],
                });
              }
              break;
            case 'test':
              {
                client.emit('guildMemberAdd', interaction.member);
                interaction.editReply(i18next.t('welcome.message.test', { lng }));
              }
              break;
            case 'placeholders':
              {
                interaction.editReply(
                  [
                    `{user} - ${user.toString()}`,
                    `{user.mention} - ${user.toString()}`,
                    `{user.username} - ${user.username}`,
                    `{user.id} - ${user.id}`,
                    `{user.avatar} - [URL](<${user.displayAvatarURL()}>)`,
                    ``,
                    `{server} - ${guild.name}`,
                    `{server.name} - ${guild.name}`,
                    `{server.id} - ${guild.id}`,
                    `{server.member_count} - ${guild.memberCount}`,
                    `{server.icon} - [URL](<${guild.iconURL()}>)`,
                  ].join('\n')
                );
              }
              break;
          }
        }
        break;
    }
  },
});

import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, EmbedBuilder, PermissionFlagsBits, type APIEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

import { CustomEmbedBuilder } from 'utils/embed';

import type { Message } from 'models/guild';

export default new Command({
  module: ModuleType.Config,
  data: {
    name: 'config-farewell',
    description: 'Configure the farewell module',
    default_member_permissions: `${PermissionFlagsBits.ManageGuild}`,
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.Guild],
    integration_types: [IntegrationTypes.GuildInstall],
    options: [
      {
        name: 'channel',
        description: 'Configure the leave channel',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'set',
            description: 'Sets the leave channel',
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
            description: 'Removes the leave channel',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'show',
            description: 'Shows the current leave channel',
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
      {
        name: 'message',
        description: 'Configure the leave message',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'set',
            description: 'Sets the leave message',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'remove',
            description: 'Removes the leave message',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'show',
            description: 'Shows the current leave message',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'test',
            description: 'Emits the leave event to test farewell messages',
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
      case 'channel':
        {
          switch (options.getSubcommand()) {
            case 'set':
              {
                const channel = options.getChannel('channel', true, [ChannelType.GuildText]);
                if (settings.farewell.channelId === channel.id) return interaction.editReply(i18next.t('farewell.channel.already', { lng }));
                await client.updateGuildSettings(guild.id, { $set: { ['farewell.channelId']: channel.id } });
                await interaction.editReply(i18next.t('farewell.channel.set', { lng }));
              }
              break;
            case 'remove':
              {
                if (!settings.farewell.channelId) return interaction.editReply(i18next.t('farewell.channel.invalid', { lng }));
                await client.updateGuildSettings(guild.id, { $set: { ['farewell.channelId']: undefined } });
                await interaction.editReply(i18next.t('farewell.channel.removed', { lng }));
              }
              break;
            case 'show':
              {
                if (!settings.farewell.channelId) return interaction.editReply(i18next.t('farewell.channel.none', { lng }));
                await interaction.editReply(i18next.t('farewell.channel.show', { lng, channel: `<#${settings.farewell.channelId}>` }));
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
                const customBuilder = new CustomEmbedBuilder({ client, interaction, data: settings.farewell.message });
                customBuilder.once('submit', async (data: Message) => {
                  await client.updateGuildSettings(guild.id, { $set: { ['farewell.message']: data } });
                  interaction.editReply({ content: i18next.t('farewell.message.set', { lng }), embeds: [], components: [] }).catch(() => {});
                });
              }
              break;
            case 'remove':
              {
                await client.updateGuildSettings(guild.id, {
                  $set: {
                    ['farewell.message']: {
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
                interaction.editReply(i18next.t('farewell.message.removed', { lng })).catch(() => {});
              }
              break;
            case 'show':
              {
                await interaction.editReply({
                  content: settings.farewell.message.content,
                  embeds: [EmbedBuilder.from(settings.farewell.message.embed as APIEmbed)],
                });
              }
              break;
            case 'test':
              {
                client.emit('guildMemberRemove', interaction.member);
                interaction.editReply(i18next.t('farewell.message.test', { lng }));
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

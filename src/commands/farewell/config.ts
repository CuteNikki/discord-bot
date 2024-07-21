import {
  ApplicationIntegrationType,
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type APIEmbed,
} from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';
import { CustomEmbedBuilder } from 'classes/custom-embed';

import type { Message } from 'models/guild';

export default new Command({
  module: ModuleType.Config,
  data: new SlashCommandBuilder()
    .setName('config-farewell')
    .setDescription('Configure the farewell module')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName('channel')
        .setDescription('Configure the leave channel')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('set')
            .setDescription('Sets the leave channel')
            .addChannelOption((option) =>
              option.setName('channel').setDescription('The channel to set it to').setRequired(true).addChannelTypes(ChannelType.GuildText)
            )
        )
        .addSubcommand((subcommand) => subcommand.setName('remove').setDescription('Removes the leave channel'))
        .addSubcommand((subcommand) => subcommand.setName('show').setDescription('Shows the current leave channel'))
    )
    .addSubcommandGroup((subcommandGroup) =>
      subcommandGroup
        .setName('message')
        .setDescription('Configure the leave message')
        .addSubcommand((subcommand) => subcommand.setName('set').setDescription('Sets the leave message'))
        .addSubcommand((subcommand) => subcommand.setName('remove').setDescription('Removes the leave message'))
        .addSubcommand((subcommand) => subcommand.setName('show').setDescription('Shows the current leave message'))
        .addSubcommand((subcommand) => subcommand.setName('test').setDescription('Emits the leave event to test farewell messages'))
        .addSubcommand((subcommand) => subcommand.setName('placeholders').setDescription('Shows you all available placeholders'))
    ),
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
                if (settings.farewell.channelId === channel.id) return interaction.editReply(t('farewell.channel.already', { lng }));
                await client.updateGuildSettings(guild.id, { $set: { ['farewell.channelId']: channel.id } });
                await interaction.editReply(t('farewell.channel.set', { lng }));
              }
              break;
            case 'remove':
              {
                if (!settings.farewell.channelId) return interaction.editReply(t('farewell.channel.invalid', { lng }));
                await client.updateGuildSettings(guild.id, { $set: { ['farewell.channelId']: undefined } });
                await interaction.editReply(t('farewell.channel.removed', { lng }));
              }
              break;
            case 'show':
              {
                if (!settings.farewell.channelId) return interaction.editReply(t('farewell.channel.none', { lng }));
                await interaction.editReply(t('farewell.channel.show', { lng, channel: `<#${settings.farewell.channelId}>` }));
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
                  interaction.editReply({ content: t('farewell.message.set', { lng }), embeds: [], components: [] }).catch(() => {});
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
                interaction.editReply(t('farewell.message.removed', { lng })).catch(() => {});
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
                interaction.editReply(t('farewell.message.test', { lng }));
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

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
import { logger } from '../../structure/utilities/logger';

export default new Command({
  module: ModuleType.Config,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('config-welcome')
    .setDescription('Configure the welcome module')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addSubcommandGroup((group) =>
      group
        .setName('roles')
        .setDescription('Configure the join roles')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('add')
            .setDescription('Adds a join role to the list')
            .addRoleOption((option) => option.setName('role').setDescription('The role to add').setRequired(true)),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('remove')
            .setDescription('Removes a join role from the list')
            .addStringOption((option) => option.setName('role-id').setDescription('The role to remove').setRequired(true)),
        )
        .addSubcommand((subcommand) => subcommand.setName('list').setDescription('Shows all the current join roles')),
    )
    .addSubcommandGroup((group) =>
      group
        .setName('channel')
        .setDescription('Configure the join channel')
        .addSubcommand((subcommand) =>
          subcommand
            .setName('set')
            .setDescription('Sets the join channel')
            .addChannelOption((option) =>
              option.setName('channel').setDescription('The channel to set it to').addChannelTypes(ChannelType.GuildText).setRequired(true),
            ),
        )
        .addSubcommand((subcommand) => subcommand.setName('remove').setDescription('Removes the join channel'))
        .addSubcommand((subcommand) => subcommand.setName('show').setDescription('Shows the current join channel')),
    )
    .addSubcommandGroup((group) =>
      group
        .setName('message')
        .setDescription('Configure the join message')
        .addSubcommand((subcommand) => subcommand.setName('set').setDescription('Sets the join message'))
        .addSubcommand((subcommand) => subcommand.setName('remove').setDescription('Removes the join message'))
        .addSubcommand((subcommand) => subcommand.setName('show').setDescription('Shows the current join message'))
        .addSubcommand((subcommand) => subcommand.setName('test').setDescription('Emits the join event to test welcome messages'))
        .addSubcommand((subcommand) => subcommand.setName('placeholders').setDescription('Shows you all available placeholders')),
    ),
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
                if (settings.welcome.roles.includes(role.id)) return interaction.editReply(t('welcome.roles.already', { lng }));
                await client.updateGuildSettings(guild.id, {
                  $push: { ['welcome.roles']: role.id },
                });
                await interaction.editReply(t('welcome.roles.added', { lng }));
              }
              break;
            case 'remove':
              {
                const roleId = options.getString('role-id', true);
                if (!settings.welcome.roles.includes(roleId)) return interaction.editReply(t('welcome.roles.invalid', { lng }));
                await client.updateGuildSettings(guild.id, {
                  $pull: { ['welcome.roles']: roleId },
                });
                await interaction.editReply(t('welcome.roles.removed', { lng }));
              }
              break;
            case 'list':
              {
                if (!settings.welcome.roles.length) return interaction.editReply(t('welcome.roles.none', { lng }));
                await interaction.editReply(`${t('welcome.roles.list', { lng })}\n\n${settings.welcome.roles.map((role) => `<@&${role}>`).join(', ')}`);
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
                if (settings.welcome.channelId === channel.id) return interaction.editReply(t('welcome.channel.already', { lng }));
                await client.updateGuildSettings(guild.id, {
                  $set: { ['welcome.channelId']: channel.id },
                });
                await interaction.editReply(t('welcome.channel.set', { lng }));
              }
              break;
            case 'remove':
              {
                if (!settings.welcome.channelId) return interaction.editReply(t('welcome.channel.invalid', { lng }));
                await client.updateGuildSettings(guild.id, {
                  $set: { ['welcome.channelId']: undefined },
                });
                await interaction.editReply(t('welcome.channel.removed', { lng }));
              }
              break;
            case 'show':
              {
                if (!settings.welcome.channelId) return interaction.editReply(t('welcome.channel.none', { lng }));
                await interaction.editReply(
                  t('welcome.channel.show', {
                    lng,
                    channel: `<#${settings.welcome.channelId}>`,
                  }),
                );
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
                const customBuilder = new CustomEmbedBuilder({
                  client,
                  interaction,
                  data: settings.welcome.message,
                });
                customBuilder.once('submit', async (data: Message) => {
                  await client.updateGuildSettings(guild.id, {
                    $set: { ['welcome.message']: data },
                  });
                  interaction
                    .editReply({
                      content: t('welcome.message.set', { lng }),
                      embeds: [],
                      components: [],
                    })
                    .catch((error) => logger.debug({ error }, 'Could not send reply'));
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
                interaction.editReply(t('welcome.message.removed', { lng }));
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
                interaction.editReply(t('welcome.message.test', { lng }));
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
                  ].join('\n'),
                );
              }
              break;
          }
        }
        break;
    }
  },
});

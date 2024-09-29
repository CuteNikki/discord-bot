import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';
import { CustomEmbedBuilder, getEmbed, isEmptyEmbed } from 'classes/custom-embed';

import { getGuildSettings, updateGuildSettings } from 'db/guild';

import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.Config,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setName('welcome')
    .setDescription('Join messages for your server')
    .addSubcommand((cmd) =>
      cmd
        .setName('channel')
        .setDescription('The channel to send join messages to')
        .addChannelOption((option) =>
          option.setName('channel').setDescription('Join messages channel (leave empty to remove)').addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((cmd) => cmd.setName('message').setDescription('Configure the message that is sent on join'))
    .addSubcommand((cmd) => cmd.setName('roles').setDescription('The roles that are assigned to a member on join'))
    .addSubcommand((cmd) => cmd.setName('info').setDescription('Shows you the current settings and available placeholders'))
    .addSubcommand((cmd) => cmd.setName('enable').setDescription('Enable the welcome module'))
    .addSubcommand((cmd) => cmd.setName('disable').setDescription('Disable the welcome module')),

  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply();

    const { options, guild, user } = interaction;

    const config = await getGuildSettings(guild.id);

    switch (options.getSubcommand()) {
      case 'channel':
        {
          const channel = options.getChannel('channel', false, [ChannelType.GuildText]);

          if (!channel) {
            if (!config.welcome.channelId) {
              return interaction.editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('welcome.channel.invalid', { lng }))],
              });
            }
            await updateGuildSettings(guild.id, {
              $set: {
                ['welcome.channelId']: null,
              },
            });

            return interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.welcome).setDescription(t('welcome.channel.removed', { lng }))],
            });
          }

          await updateGuildSettings(guild.id, {
            $set: {
              ['welcome.channelId']: channel.id,
            },
          });
          interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.welcome).setDescription(t('welcome.channel.set', { lng, channel: `<#${channel.id}>` }))],
          });
        }
        break;
      case 'message':
        {
          const customBuilder = new CustomEmbedBuilder({
            client,
            interaction,
            message: config.welcome.message,
          });
          customBuilder.once('submit', async (msg) => {
            await updateGuildSettings(guild.id, {
              $set: {
                ['welcome.message']: msg,
              },
            });

            interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.welcome).setDescription(t('welcome.message.set', { lng }))],
                components: [],
              })
              .catch((err) => logger.debug({ err }, 'Could not edit reply'));
          });
        }
        break;
      case 'roles':
        {
          const rolesEmbed = new EmbedBuilder().setColor(client.colors.welcome).addFields({
            name: t('welcome.roles.title', { lng }),
            value: config.welcome.roles.length ? config.welcome.roles.map((r) => `<@&${r}>`).join('\n') : '/',
          });
          const warning = new EmbedBuilder()
            .setColor(client.colors.warning)
            .setDescription(`${client.customEmojis.warning} ${t('welcome.state.warning', { lng })}`);

          interaction.editReply({
            embeds: config.welcome.enabled ? [rolesEmbed] : [warning, rolesEmbed],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder().setCustomId('button-welcome-add-role').setLabel(t('welcome.roles.add-role-button', { lng })).setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId('button-welcome-remove-role')
                  .setLabel(t('welcome.roles.remove-role-button', { lng }))
                  .setStyle(ButtonStyle.Danger),
              ),
            ],
          });
        }
        break;
      case 'info':
        {
          const embeds = [
            new EmbedBuilder().setColor(client.colors.welcome).addFields(
              { name: t('welcome.state.title', { lng }), value: config.welcome.enabled ? t('enabled', { lng }) : t('disabled', { lng }) },
              { name: t('welcome.channel.title', { lng }), value: config.welcome.channelId ? `<#${config.welcome.channelId}>` : t('none', { lng }) },
              {
                name: t('welcome.roles.title', { lng }),
                value: config.welcome.roles.length ? config.welcome.roles.map((r) => `<@&${r}>`).join('\n') : t('none', { lng }),
              },
              {
                name: t('welcome.placeholders.title', { lng }),
                value: [
                  `{user} - ${user.toString()}`,
                  `{user.mention} - ${user.toString()}`,
                  `{user.username} - ${user.username}`,
                  `{user.id} - ${user.id}`,
                  `{user.avatar} - [URL](<${user.displayAvatarURL()}>)`,
                  '', // New line to separate user and server placeholders
                  `{server} - ${guild.name}`,
                  `{server.name} - ${guild.name}`,
                  `{server.id} - ${guild.id}`,
                  `{server.member_count} - ${guild.memberCount}`,
                  `{server.icon} - [URL](<${guild.iconURL()}>)`,
                ].join('\n'),
              },
            ),
          ];

          if (!isEmptyEmbed(config.welcome.message.embed)) {
            embeds.push(getEmbed(user, guild, config.welcome.message.embed));
          }

          interaction.editReply({
            embeds,
          });
        }
        break;
      case 'enable':
        {
          if (config.welcome.enabled) {
            return interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('welcome.state.already_enabled', { lng }))],
            });
          }

          await updateGuildSettings(guild.id, {
            $set: {
              ['welcome.enabled']: true,
            },
          });

          interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.welcome).setDescription(t('welcome.state.enabled', { lng }))],
          });
        }
        break;
      case 'disable':
        {
          if (!config.welcome.enabled) {
            return interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('welcome.state.already_disabled', { lng }))],
            });
          }

          await updateGuildSettings(guild.id, {
            $set: {
              ['welcome.enabled']: false,
            },
          });

          interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.welcome).setDescription(t('welcome.state.disabled', { lng }))],
          });
        }
        break;
    }
  },
});

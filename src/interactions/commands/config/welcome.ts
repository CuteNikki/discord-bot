import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  channelMention,
  ChannelType,
  EmbedBuilder,
  hyperlink,
  InteractionContextType,
  PermissionFlagsBits,
  roleMention,
  RoleSelectMenuBuilder,
  SlashCommandBuilder
} from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';
import { CustomEmbedBuilder, getEmbed, isEmptyEmbed } from 'classes/custom-embed';

import { disableWelcome, enableWelcome, getWelcome, removeWelcomeChannel, updateWelcomeChannel, updateWelcomeMessage } from 'db/welcome';

import { logger } from 'utils/logger';

import { ModuleType } from 'types/interactions';

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
          option.setName('channel').setDescription('Join messages channel (leave empty to remove)').addChannelTypes(ChannelType.GuildText)
        )
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

    const welcome = (await getWelcome(guild.id)) ?? { enabled: false, channelId: undefined, roles: [], message: { content: null, embed: {} } };

    switch (options.getSubcommand()) {
      case 'channel':
        {
          const channel = options.getChannel('channel', false, [ChannelType.GuildText]);

          if (!channel) {
            if (!welcome.channelId) {
              return interaction.editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('welcome.channel.invalid', { lng }))]
              });
            }

            await removeWelcomeChannel(guild.id);

            return interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.welcome).setDescription(t('welcome.channel.removed', { lng }))]
            });
          }

          await updateWelcomeChannel(guild.id, channel.id);

          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.welcome).setDescription(t('welcome.channel.set', { lng, channel: channel.toString() }))]
          });
        }
        break;
      case 'message':
        {
          const customBuilder = new CustomEmbedBuilder({
            client,
            interaction,
            message: welcome.message
          });
          customBuilder.once('submit', async (msg) => {
            await updateWelcomeMessage(guild.id, msg);

            interaction
              .editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.welcome).setDescription(t('welcome.message.set', { lng }))],
                components: []
              })
              .catch((err) => logger.debug({ err }, 'Could not edit reply'));
          });
        }
        break;
      case 'roles':
        {
          const rolesEmbed = new EmbedBuilder()
            .setColor(client.colors.welcome)
            .setTitle(t('welcome.roles.title', { lng }))
            .setDescription(
              welcome.roles.length
                ? welcome.roles
                    .map((r) => {
                      const role = guild.roles.cache.get(r);
                      return role ? role.toString() : r;
                    })
                    .join('\n')
                : t('none', { lng })
            );

          interaction.editReply({
            embeds: welcome.enabled
              ? [rolesEmbed]
              : [
                  rolesEmbed,
                  new EmbedBuilder().setColor(client.colors.warning).setDescription(`${client.customEmojis.warning} ${t('welcome.state.warning', { lng })}`)
                ],
            components: [
              new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
                new RoleSelectMenuBuilder()
                  .setCustomId('selection-welcome-roles')
                  .setDefaultRoles(welcome.roles)
                  .setMinValues(0)
                  .setMaxValues(15)
                  .setPlaceholder(t('welcome.roles.placeholder', { lng }))
              )
            ]
          });
        }
        break;
      case 'info':
        {
          const embeds = [
            new EmbedBuilder().setColor(client.colors.welcome).addFields(
              { name: t('welcome.state.title', { lng }), value: welcome.enabled ? t('enabled', { lng }) : t('disabled', { lng }) },
              { name: t('welcome.channel.title', { lng }), value: welcome.channelId ? channelMention(welcome.channelId) : t('none', { lng }) },
              {
                name: t('welcome.roles.title', { lng }),
                value: welcome.roles.length ? welcome.roles.map((r) => roleMention(r)).join('\n') : t('none', { lng })
              },
              {
                name: t('welcome.placeholders.title', { lng }),
                value: [
                  `{user} - ${user.toString()}`,
                  `{user.mention} - ${user.toString()}`,
                  `{user.username} - ${user.username}`,
                  `{user.id} - ${user.id}`,
                  `{user.avatar} - ${hyperlink('URL', user.displayAvatarURL())}`,
                  '', // New line to separate user and server placeholders
                  `{server} - ${guild.name}`,
                  `{server.name} - ${guild.name}`,
                  `{server.id} - ${guild.id}`,
                  `{server.member_count} - ${guild.memberCount}`,
                  `{server.icon} - ${hyperlink('URL', guild.icon ? guild.iconURL()! : t('none', { lng }))}`
                ].join('\n')
              }
            )
          ];

          if (!isEmptyEmbed(welcome.message.embed)) {
            embeds.push(getEmbed(user, guild, welcome.message.embed));
          }

          interaction.editReply({
            embeds
          });
        }
        break;
      case 'enable':
        {
          if (welcome.enabled) {
            return interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('welcome.state.already-enabled', { lng }))]
            });
          }

          await enableWelcome(guild.id);

          interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.welcome).setDescription(t('welcome.state.enabled', { lng }))]
          });
        }
        break;
      case 'disable':
        {
          if (!welcome.enabled) {
            return interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('welcome.state.already-disabled', { lng }))]
            });
          }

          await disableWelcome(guild.id);

          interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.welcome).setDescription(t('welcome.state.disabled', { lng }))]
          });
        }
        break;
    }
  }
});

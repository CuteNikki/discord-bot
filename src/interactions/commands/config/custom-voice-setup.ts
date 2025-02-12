import {
  ApplicationIntegrationType,
  channelMention,
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder
} from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { disableCustomVoice, enableCustomVoice, getCustomVoice, setCustomVoiceChannel, setCustomVoiceLimit, setCustomVoiceParent } from 'db/custom-voice';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Config,
  botPermissions: ['ManageChannels'],
  data: new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .setName('custom-voice-setup')
    .setDescription('Give members the option to create their own customizable voice channel')
    .addSubcommand((cmd) =>
      cmd
        .setName('channel')
        .setDescription('If members join this channel, a new customizable channel will be created for them')
        .addChannelOption((option) =>
          option.setName('channel').setDescription('(leave empty to remove, use info to see current channel)').addChannelTypes(ChannelType.GuildVoice)
        )
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('category')
        .setDescription('Category where custom vcs will be created')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription("(leave empty to remove, defaults to the creation channel's parent)")
            .addChannelTypes(ChannelType.GuildCategory)
        )
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('max-members')
        .setDescription('Sets the default max member limit of the custom voice channels')
        .addIntegerOption((option) => option.setName('limit').setDescription('The limit of members').setMinValue(0).setMaxValue(99).setRequired(true))
    )
    .addSubcommand((cmd) => cmd.setName('enable').setDescription('Enables the custom voice channel feature'))
    .addSubcommand((cmd) => cmd.setName('disable').setDescription('Disables the custom voice channel feature'))
    .addSubcommand((cmd) => cmd.setName('info').setDescription('Shows the current custom voice channel settings')),
  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild()) return;

    const config = (await getCustomVoice(interaction.guildId)) ?? { channelId: null, parentId: null, enabled: false, defaultLimit: 'infinite' };

    switch (interaction.options.getSubcommand()) {
      case 'channel':
        {
          const channel = interaction.options.getChannel('channel', false, [ChannelType.GuildVoice]);

          if (!channel && !config.channelId) {
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.channel.not-set', { lng }))] });
            return;
          }

          if (!channel) {
            await setCustomVoiceChannel(interaction.guild.id, null);
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom-vc.channel.removed', { lng }))] });
            return;
          }

          if (channel.id === config.channelId) {
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.channel.already', { lng }))] });
            return;
          }

          await setCustomVoiceChannel(interaction.guild.id, channel.id);
          await interaction.reply({
            embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom-vc.channel.success', { lng, channel: channel.toString() }))]
          });
        }
        break;
      case 'category':
        {
          const channel = interaction.options.getChannel('channel', false, [ChannelType.GuildCategory]);

          if (!channel && !config.parentId) {
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.parent.not-set', { lng }))] });
            return;
          }

          if (!channel) {
            await setCustomVoiceParent(interaction.guild.id, null);
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom-vc.parent.removed', { lng }))] });
            return;
          }

          if (channel.id === config.parentId) {
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.parent.already', { lng }))] });
            return;
          }

          await setCustomVoiceParent(interaction.guild.id, channel.id);
          await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom-vc.parent.success', { lng }))] });
        }
        break;
      case 'max-members':
        {
          const limit = interaction.options.getInteger('limit', true);

          if (limit === config.defaultLimit) {
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.max-members.already', { lng }))] });
            return;
          }

          await setCustomVoiceLimit(interaction.guild.id, limit);
          await interaction.reply({
            embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom-vc.max-members.success', { lng, limit }))]
          });
        }
        break;
      case 'enable':
        {
          if (config.enabled) {
            await interaction.reply({
              embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom-vc.state.already-enabled', { lng }))]
            });
            return;
          }

          const embeds = [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom-vc.state.enabled', { lng }))];

          if (!config.channelId) embeds.push(new EmbedBuilder().setColor(client.colors.warning).setDescription(t('custom-vc.state.enable-warning', { lng })));

          await enableCustomVoice(interaction.guild.id);
          await interaction.reply({ embeds });
        }
        break;
      case 'disable':
        {
          if (!config.enabled) {
            await interaction.reply({
              embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom-vc.state.already-disabled', { lng }))]
            });
            return;
          }
          await disableCustomVoice(interaction.guild.id);
          await interaction.reply({
            embeds: [
              new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom-vc.state.disabled', { lng })),
              new EmbedBuilder().setColor(client.colors.warning).setDescription(t('custom-vc.state.disable-warning', { lng }))
            ]
          });
        }
        break;
      case 'info':
        {
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.customVC)
                .addFields(
                  { name: t('custom-vc.state.title', { lng }), value: config.enabled ? t('enabled', { lng }) : t('disabled', { lng }) },
                  { name: t('custom-vc.channel.title', { lng }), value: config.channelId ? channelMention(config.channelId) : t('none', { lng }) },
                  { name: t('custom-vc.parent.title', { lng }), value: config.parentId ? channelMention(config.parentId) : t('none', { lng }) },
                  { name: t('custom-vc.max-members.title', { lng }), value: config.defaultLimit ? config.defaultLimit.toString() : t('none', { lng }) }
                )
            ]
          });
        }
        break;
    }
  }
});

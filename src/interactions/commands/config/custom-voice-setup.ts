import { ApplicationIntegrationType, ChannelType, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { getCustomVoice, setCustomVoiceChannel, setCustomVoiceParent } from 'db/custom-voice';

export default new Command({
  module: ModuleType.Config,
  botPermissions: ['ManageChannels'],
  data: new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .setName('custom-voice-setup')
    .setDescription('Give members the option to create their own voice channel')
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
    .addSubcommand((cmd) => cmd.setName('info').setDescription('Shows the current custom voice channel settings')),
  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild()) return;

    const config = (await getCustomVoice(interaction.guildId)) ?? { channelId: null, parentId: null };

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
      case 'parent':
        {
          const channel = interaction.options.getChannel('category', false, [ChannelType.GuildCategory]);

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
      case 'info':
        {
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.customVC)
                .addFields(
                  { name: t('custom-vc.channel.title', { lng }), value: config.channelId ? `<#${config.channelId}>` : t('none', { lng }) },
                  { name: t('custom-vc.parent.title', { lng }), value: config.parentId ? `<#${config.parentId}>` : t('none', { lng }) }
                )
            ]
          });
        }
        break;
    }
  }
});

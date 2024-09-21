import { ApplicationIntegrationType, ChannelType, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { getGuildSettings, updateGuildSettings } from 'db/guild';
import { getUserLanguage } from 'db/user';

export default new Command({
  module: ModuleType.Config,
  botPermissions: ['ManageChannels'],
  data: new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .setName('custom-voice-channel')
    .setDescription('Give members the option to create their own voice channel')
    .addSubcommand((cmd) =>
      cmd
        .setName('channel')
        .setDescription('If members join this channel, a new customizable channel will be created for them')
        .addChannelOption((option) =>
          option.setName('channel').setDescription('(leave empty to remove, use info to see current channel)').addChannelTypes(ChannelType.GuildVoice),
        ),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('category')
        .setDescription('Category where custom vcs will be created')
        .addChannelOption((option) =>
          option
            .setName('channel')
            .setDescription("(leave empty to remove, defaults to the creation channel's parent)")
            .addChannelTypes(ChannelType.GuildCategory),
        ),
    )
    .addSubcommand((cmd) => cmd.setName('info').setDescription('Shows the current custom voice channel settings')),
  async execute({ client, interaction }) {
    if (!interaction.inCachedGuild()) return;

    const lng = await getUserLanguage(interaction.user.id);
    const config = await getGuildSettings(interaction.guildId);

    switch (interaction.options.getSubcommand()) {
      case 'channel':
        {
          const channel = interaction.options.getChannel('channel', false, [ChannelType.GuildVoice]);

          if (!channel && !config.customVC.channelId) {
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom_vc.channel.not_set', { lng }))] });
            return;
          }

          if (!channel) {
            await updateGuildSettings(interaction.guild.id, { $unset: { ['customVC.channelId']: 1 } });
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom_vc.channel.removed', { lng }))] });
            return;
          }

          if (channel.id === config.customVC.channelId) {
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom_vc.channel.already', { lng }))] });
            return;
          }

          await updateGuildSettings(interaction.guild.id, { $set: { ['customVC.channelId']: channel.id } });

          await interaction.reply({
            embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom_vc.channel.success', { lng, channel: channel.toString() }))],
          });
        }
        break;
      case 'parent':
        {
          const channel = interaction.options.getChannel('category', false, [ChannelType.GuildCategory]);

          if (!channel && !config.customVC.parentId) {
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom_vc.parent.not_set', { lng }))] });
            return;
          }

          if (!channel) {
            await updateGuildSettings(interaction.guild.id, { $unset: { ['customVC.parentId']: 1 } });
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom_vc.parent.removed', { lng }))] });
            return;
          }

          if (channel.id === config.customVC.parentId) {
            await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom_vc.parent.already', { lng }))] });
            return;
          }

          await updateGuildSettings(interaction.guild.id, { $set: { ['customVC.parentId']: channel.id } });

          await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom_vc.parent.success', { lng }))] });
        }
        break;
      case 'info':
        {
          await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.customVC)
                .addFields(
                  { name: t('custom_vc.channel.title', { lng }), value: config.customVC.channelId ? `<#${config.customVC.channelId}>` : t('none', { lng }) },
                  { name: t('custom_vc.parent.title', { lng }), value: config.customVC.parentId ? `<#${config.customVC.parentId}>` : t('none', { lng }) },
                ),
            ],
          });
        }
        break;
    }
  },
});

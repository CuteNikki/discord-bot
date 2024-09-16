import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';
import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.Config,
  botPermissions: ['ManageChannels', 'MoveMembers'],
  data: new SlashCommandBuilder()
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .setName('customize-voice-channel')
    .setDescription('Manage your own custom voice channel')
    .addSubcommand((cmd) => cmd.setName('public').setDescription('Makes the channel accessible to everyone'))
    .addSubcommand((cmd) => cmd.setName('private').setDescription('Makes the channel only accessible to you or people you invite'))
    .addSubcommand((cmd) =>
      cmd
        .setName('invite')
        .setDescription('Invite someone to join your channel (gives them permissions')
        .addUserOption((option) => option.setName('user').setDescription('The user to invite').setRequired(true)),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('remove')
        .setDescription('Remove permissions from someone to join your channel')
        .addUserOption((option) => option.setName('user').setDescription('The user to remove permissions of').setRequired(true)),
    ),
  async execute({ client, interaction }) {
    if (!interaction.inCachedGuild()) return;

    const lng = await client.getUserLanguage(interaction.user.id);

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom_vc.not_in_vc', { lng }))] });
    }

    const customVoiceChannel = await client.getCustomVoiceChannel(voiceChannel.id);

    if (!customVoiceChannel) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom_vc.not_in_custom_vc', { lng }))] });
    }

    if (interaction.user.id !== customVoiceChannel.ownerId) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom_vc.not_owner', { lng }))] });
    }

    switch (interaction.options.getSubcommand()) {
      case 'public':
        {
          if (voiceChannel.permissionOverwrites.cache.get(interaction.guildId)?.allow.has(PermissionFlagsBits.Connect)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom_vc.public.already', { lng }))] });
          }

          try {
            await voiceChannel.permissionOverwrites.edit(interaction.guildId, { Connect: true, Speak: true, ViewChannel: true, SendMessages: true });
            interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom_vc.public.success', { lng }))] });
          } catch (err) {
            logger.debug(err, 'Could not give permissions');
            interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom_vc.public.error', { lng }))] });
          }
        }
        break;
      case 'private':
        {
          if (!voiceChannel.permissionOverwrites.cache.get(interaction.guildId)?.allow.has(PermissionFlagsBits.Connect)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom_vc.private.already', { lng }))] });
          }

          try {
            await voiceChannel.permissionOverwrites.edit(interaction.guildId, { Connect: false, Speak: false, ViewChannel: false, SendMessages: false });
            interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom_vc.private.success', { lng }))] });
          } catch (err) {
            logger.debug(err, 'Could not remove permissions');
            interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom_vc.private.error', { lng }))] });
          }
        }
        break;
      case 'invite':
        {
          const user = interaction.options.getUser('user', true);

          if (
            voiceChannel.permissionOverwrites.cache.get(user.id)?.allow.has(PermissionFlagsBits.Connect) &&
            !voiceChannel.permissionOverwrites.cache.get(user.id)?.deny.has(PermissionFlagsBits.Connect)
          ) {
            return interaction.reply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom_vc.invite.already', { lng, user }))],
            });
          }

          try {
            await voiceChannel.permissionOverwrites.edit(user.id, { Connect: true, Speak: true, ViewChannel: true, SendMessages: true });
            interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom_vc.invite.success', { lng, user }))] });
          } catch (err) {
            logger.debug(err, 'Could not give permissions to user');
            interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom_vc.invite.error', { lng, user }))] });
          }
        }
        break;
      case 'remove':
        {
          const user = interaction.options.getUser('user', true);

          if (voiceChannel.permissionOverwrites.cache.get(user.id)?.deny.has(PermissionFlagsBits.Connect)) {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom_vc.remove.already', { lng, user }))] });
          }

          let response = '';
          try {
            const member = interaction.guild.members.cache.get(user.id);
            if (member && member.voice.channelId === customVoiceChannel.channelId) {
              member.voice.disconnect();
              response += t('custom_vc.remove.disconnected', { lng, user });
            }
          } catch (err) {
            logger.debug(err, 'Could not disconnect user from custom vc');
            response += t('custom_vc.remove.not_disconnected', { lng, user });
          }

          try {
            await voiceChannel.permissionOverwrites.edit(user.id, { Connect: false, Speak: false, ViewChannel: false, SendMessages: false });
            response += t('custom_vc.remove.success', { lng, user });
          } catch (err) {
            logger.debug(err, 'Could not remove permissions from user');
            response += t('custom_vc.remove.not_removed', { lng, user });
          }

          if (response === '') {
            return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom_vc.remove.error', { lng }))] });
          }

          interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(response)] });
        }
        break;
    }
  },
});

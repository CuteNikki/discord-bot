import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { getCustomVoiceChannel, getCustomVoiceChannelByOwner, setCustomVoiceOwner } from 'db/custom-voice-channel';

import { logger } from 'utils/logger';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Config,
  botPermissions: ['ManageChannels', 'MoveMembers'],
  data: new SlashCommandBuilder()
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .setName('custom-voice')
    .setDescription('Manage your own custom voice channel')
    .addSubcommand((cmd) => cmd.setName('public').setDescription('Makes the channel accessible to everyone'))
    .addSubcommand((cmd) => cmd.setName('private').setDescription('Makes the channel only accessible to you or people you invite'))
    .addSubcommand((cmd) =>
      cmd
        .setName('invite')
        .setDescription('Invite someone to join your channel (gives them permissions')
        .addUserOption((option) => option.setName('user').setDescription('The user to invite').setRequired(true))
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('remove')
        .setDescription('Remove permissions from someone to join your channel')
        .addUserOption((option) => option.setName('user').setDescription('The user to remove permissions of').setRequired(true))
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('max-members')
        .setDescription('Change the max amount of members for your custom voice')
        .addIntegerOption((option) => option.setName('limit').setDescription('The limit of members').setMinValue(0).setMaxValue(99).setRequired(true))
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('transfer')
        .setDescription('Transfer ownership of the custom voice channel to someone else')
        .addUserOption((option) => option.setName('member').setDescription('The member to transfer the ownership to').setRequired(true))
    ),
  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild()) {
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.not-in-vc', { lng }))] });
      return;
    }

    const customVoiceChannel = await getCustomVoiceChannel(voiceChannel.id);

    if (!customVoiceChannel) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.not-in-custom-vc', { lng }))] });
      return;
    }

    if (interaction.user.id !== customVoiceChannel.ownerId) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.not-owner', { lng }))] });
      return;
    }

    switch (interaction.options.getSubcommand()) {
      case 'public':
        {
          if (voiceChannel.permissionOverwrites.cache.get(interaction.guildId)?.allow.has(PermissionFlagsBits.Connect)) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.public.already', { lng }))] });
            return;
          }

          try {
            await voiceChannel.permissionOverwrites.edit(interaction.guildId, {
              Connect: true,
              Speak: true,
              ViewChannel: true,
              SendMessages: true
            });
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom-vc.public.success', { lng }))]
            });
          } catch (err) {
            logger.debug(err, 'Could not give permissions');
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.public.error', { lng }))] });
          }
        }
        break;
      case 'private':
        {
          if (!voiceChannel.permissionOverwrites.cache.get(interaction.guildId)?.allow.has(PermissionFlagsBits.Connect)) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.private.already', { lng }))] });
            return;
          }

          try {
            await voiceChannel.permissionOverwrites.edit(interaction.guildId, {
              Connect: false,
              Speak: false,
              ViewChannel: false,
              SendMessages: false
            });
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom-vc.private.success', { lng }))]
            });
          } catch (err) {
            logger.debug(err, 'Could not remove permissions');
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.private.error', { lng }))] });
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
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.invite.already', { lng, user: user.toString() }))]
            });
            return;
          }

          try {
            await voiceChannel.permissionOverwrites.edit(user.id, {
              Connect: true,
              Speak: true,
              ViewChannel: true,
              SendMessages: true
            });
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom-vc.invite.success', { lng, user: user.toString() }))]
            });
          } catch (err) {
            logger.debug(err, 'Could not give permissions to user');
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.invite.error', { lng, user: user.toString() }))]
            });
          }
        }
        break;
      case 'remove':
        {
          const user = interaction.options.getUser('user', true);

          if (voiceChannel.permissionOverwrites.cache.get(user.id)?.deny.has(PermissionFlagsBits.Connect)) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.remove.already', { lng, user: user.toString() }))]
            });
            return;
          }

          let response = '';

          try {
            const member = interaction.guild.members.cache.get(user.id);

            if (member && member.voice.channelId === customVoiceChannel.channelId) {
              await member.voice.disconnect();
              response += t('custom-vc.remove.disconnected', { lng, user: user.toString() });
            }
          } catch (err) {
            logger.debug(err, 'Could not disconnect user from custom vc');
            response += t('custom-vc.remove.not-disconnected', { lng, user: user.toString() });
          }

          try {
            await voiceChannel.permissionOverwrites.edit(user.id, {
              Connect: false,
              Speak: false,
              ViewChannel: false,
              SendMessages: false
            });
            response += t('custom-vc.remove.success', { lng, user: user.toString() });
          } catch (err) {
            logger.debug(err, 'Could not remove permissions from user');
            response += t('custom-vc.remove.not-removed', { lng, user: user.toString() });
          }

          if (response === '') {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.remove.error', { lng }))] });
            return;
          }

          await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(response)] });
        }
        break;
      case 'max-members':
        {
          const limit = interaction.options.getInteger('limit', true);

          if (limit === voiceChannel.userLimit) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.max-members.already', { lng }))]
            });
            return;
          }

          try {
            await voiceChannel.edit({ userLimit: limit });
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom-vc.max-members.success', { lng, limit }))]
            });
          } catch (err) {
            logger.debug(err, 'Could not change max members');
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.max-members.error', { lng }))]
            });
          }
        }
        break;
      case 'transfer':
        {
          const user = interaction.options.getUser('member', true);
          const member = interaction.guild.members.cache.get(user.id);

          if (!member) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.transfer.not-found', { lng }))]
            });
            return;
          }

          if (member.id === customVoiceChannel.ownerId) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.transfer.already', { lng }))]
            });
            return;
          }

          const alreadyOwnsChannel = await getCustomVoiceChannelByOwner(member.id);

          if (alreadyOwnsChannel) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.transfer.already-owns', { lng }))]
            });
            return;
          }

          try {
            await voiceChannel.edit({ name: member.user.username });
            await voiceChannel.permissionOverwrites.edit(member.id, {
              Connect: true,
              Speak: true,
              ViewChannel: true,
              SendMessages: true,
              UseApplicationCommands: true
            });

            await setCustomVoiceOwner(voiceChannel.id, member.id);

            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.customVC).setDescription(t('custom-vc.transfer.success', { lng, user: member.toString() }))]
            });
          } catch (err) {
            logger.debug(err, 'Could not transfer ownership');
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('custom-vc.transfer.error', { lng }))]
            });
          }
        }
        break;
    }
  }
});

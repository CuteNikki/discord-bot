import {
  ApplicationIntegrationType,
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { getGuildSettings, updateGuildSettings } from 'db/guild';

export default new Command({
  module: ModuleType.Config,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('starboard')
    .setDescription('Showcases messages in a dedicated channel based on receiving a number of star reactions')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .addSubcommand((command) => command.setName('config').setDescription('Shows the starboard configuration'))
    .addSubcommand((command) => command.setName('disable').setDescription('Disables the starboard'))
    .addSubcommand((command) => command.setName('enable').setDescription('Enables the starboard'))
    .addSubcommand((command) => command.setName('delete').setDescription('Deletes the starboard'))
    .addSubcommand((command) =>
      command
        .setName('setup')
        .setDescription('Sets up the starboard')
        .addChannelOption((option) =>
          option.setName('channel').setDescription('The channel to send the starboard messages to').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('stars')
            .setDescription('The minimum amount of stars a message needs to be considered for the starboard')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
        )
    )
    .addSubcommand((command) =>
      command
        .setName('edit')
        .setDescription('Edits the starboard configuration')
        .addChannelOption((option) =>
          option.setName('channel').setDescription('The channel to send the starboard messages to').addChannelTypes(ChannelType.GuildText).setRequired(false)
        )
        .addIntegerOption((option) =>
          option
            .setName('stars')
            .setDescription('The minimum amount of stars a message needs to be considered for the starboard')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(100)
        )
    ),
  async execute({ interaction, lng }) {
    if (!interaction.inCachedGuild() || !interaction.guild.members.me) return;
    const { options, guild } = interaction;

    await interaction.deferReply({ ephemeral: true });

    const config = await getGuildSettings(guild.id);

    switch (options.getSubcommand()) {
      case 'config':
        {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder().setTitle(t('starboard.title', { lng })).addFields([
                {
                  name: t('starboard.state', { lng }),
                  value: `${config.starboard.enabled}`
                },
                {
                  name: t('starboard.channel', { lng }),
                  value: config.starboard.channelId ? `<#${config.starboard.channelId}>` : t('none', { lng })
                },
                {
                  name: t('starboard.minimum-stars', { lng }),
                  value: config.starboard.minimumStars ? config.starboard.minimumStars.toString() : t('none', { lng })
                }
              ])
            ]
          });
        }
        break;
      case 'disable':
        {
          if (!config.starboard.enabled) return await interaction.editReply({ content: t('starboard.already-disabled', { lng }) });

          await updateGuildSettings(guild.id, { $set: { ['starboard.enabled']: false } });
          await interaction.editReply({ content: t('starboard.disabled', { lng }) });
        }
        break;
      case 'enable':
        {
          if (config.starboard.enabled) return await interaction.editReply({ content: t('starboard.already-enabled', { lng }) });

          await updateGuildSettings(guild.id, { $set: { ['starboard.enabled']: true } });
          await interaction.editReply({ content: t('starboard.enabled', { lng }) });
        }
        break;
      case 'setup':
        {
          const channel = options.getChannel('channel', true);
          const minimumStars = options.getInteger('stars', true);

          if (channel.type !== ChannelType.GuildText) return await interaction.editReply({ content: t('starboard.invalid-channel', { lng }) });
          if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.SendMessages))
            return await interaction.editReply({ content: t('starboard.missing-permissions', { lng }) });
          if (minimumStars < 1 || minimumStars > 100) return await interaction.editReply({ content: t('starboard.invalid-stars', { lng }) });

          await updateGuildSettings(guild.id, {
            $set: { ['starboard.channelId']: channel.id, ['starboard.minimumStars']: minimumStars, ['starboard.enabled']: true }
          });
          await interaction.editReply({ content: t('starboard.setup', { lng }) });
        }
        break;
      case 'edit':
        {
          const channel = options.getChannel('channel', false);
          const minimumStars = options.getInteger('stars', false);

          if (!channel && !minimumStars) return await interaction.editReply({ content: t('starboard.edit-nothing', { lng }) });

          if (channel) {
            if (channel.type !== ChannelType.GuildText) return await interaction.editReply({ content: t('starboard.invalid-channel', { lng }) });
            if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.SendMessages))
              return await interaction.editReply({ content: t('starboard.missing-permissions', { lng }) });
            if (channel.id === config.starboard.channelId) return await interaction.editReply({ content: t('starboard.same-channel', { lng }) });
          }
          if (minimumStars) {
            if (isNaN(minimumStars) || minimumStars < 1 || minimumStars > 100)
              return await interaction.editReply({ content: t('starboard.invalid-stars', { lng }) });
            if (minimumStars === config.starboard.minimumStars) return await interaction.editReply({ content: t('starboard.same-stars', { lng }) });
          }

          await updateGuildSettings(guild.id, {
            $set: {
              ['starboard.channelId']: channel?.id ?? config.starboard.channelId,
              ['starboard.minimumStars']: minimumStars ?? config.starboard.minimumStars
            }
          });

          await interaction.editReply({ content: t('starboard.edited', { lng }) });
        }
        break;
      case 'delete':
        {
          if (!config.starboard.channelId && !config.starboard.minimumStars)
            return await interaction.editReply({ content: t('starboard.delete-nothing', { lng }) });

          await updateGuildSettings(guild.id, { $unset: { ['starboard.channelId']: 1, ['starboard.minimumStars']: 1 } });
          await interaction.editReply({ content: t('starboard.deleted', { lng }) });
        }
        break;
    }
  }
});

import {
  ApplicationIntegrationType,
  channelMention,
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
  SlashCommandBuilder
} from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { deleteStarboard, disableStarboard, enableStarboard, getStarboard, setupStarboard } from 'db/starboard';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Config,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setName('starboard')
    .setDescription('Showcases messages in a dedicated channel based on receiving a number of star reactions')
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
  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild() || !interaction.guild.members.me) return;
    const { options, guild } = interaction;

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const starboard = (await getStarboard(guild.id)) ?? { enabled: false, channelId: undefined, minimumStars: undefined, messages: [] };

    switch (options.getSubcommand()) {
      case 'config':
        {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.starboard)
                .setTitle(t('starboard.title', { lng }))
                .addFields([
                  {
                    name: t('starboard.state', { lng }),
                    value: `${starboard.enabled}`
                  },
                  {
                    name: t('starboard.channel', { lng }),
                    value: starboard.channelId ? channelMention(starboard.channelId) : t('none', { lng })
                  },
                  {
                    name: t('starboard.minimum-stars', { lng }),
                    value: starboard.minimumStars ? starboard.minimumStars.toString() : t('none', { lng })
                  }
                ])
            ]
          });
        }
        break;
      case 'disable':
        {
          if (!starboard.enabled) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('starboard.already-disabled', { lng }))]
            });
            return;
          }

          await disableStarboard(guild.id);
          await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.starboard).setDescription(t('starboard.disabled', { lng }))] });
        }
        break;
      case 'enable':
        {
          if (starboard.enabled) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('starboard.already-enabled', { lng }))] });
            return;
          }

          await enableStarboard(guild.id);
          await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.starboard).setDescription(t('starboard.enabled', { lng }))] });
        }
        break;
      case 'setup':
        {
          const channel = options.getChannel('channel', true);
          const minimumStars = options.getInteger('stars', true);

          if (channel.type !== ChannelType.GuildText) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('starboard.invalid-channel', { lng }))] });
            return;
          }

          if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('starboard.missing-permissions', { lng }))]
            });
            return;
          }

          if (minimumStars < 1 || minimumStars > 100) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('starboard.invalid-stars', { lng }))] });
            return;
          }

          await setupStarboard(guild.id, channel.id, minimumStars);
          await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.starboard).setDescription(t('starboard.setup', { lng }))] });
        }
        break;
      case 'edit':
        {
          const channel = options.getChannel('channel', false);
          const minimumStars = options.getInteger('stars', false);

          if (!channel && !minimumStars) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('starboard.edit-nothing', { lng }))] });
            return;
          }

          if (channel) {
            if (channel.type !== ChannelType.GuildText) {
              await interaction.editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('starboard.invalid-channel', { lng }))]
              });
              return;
            }

            if (!channel.permissionsFor(interaction.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
              await interaction.editReply({
                embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('starboard.missing-permissions', { lng }))]
              });
              return;
            }

            if (channel.id === starboard.channelId) {
              await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('starboard.same-channel', { lng }))] });
              return;
            }
          }

          if (minimumStars) {
            if (isNaN(minimumStars) || minimumStars < 1 || minimumStars > 100) {
              await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('starboard.invalid-stars', { lng }))] });
              return;
            }

            if (minimumStars === starboard.minimumStars) {
              await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('starboard.same-stars', { lng }))] });
              return;
            }
          }

          await setupStarboard(guild.id, channel?.id ?? starboard.channelId, minimumStars ?? starboard.minimumStars);

          await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.starboard).setDescription(t('starboard.edited', { lng }))] });
        }
        break;
      case 'delete':
        {
          if (!starboard.channelId && !starboard.minimumStars) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('starboard.delete-nothing', { lng }))] });
            return;
          }

          await deleteStarboard(guild.id);
          await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.starboard).setDescription(t('starboard.deleted', { lng }))] });
        }
        break;
    }
  }
});

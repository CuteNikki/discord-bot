import { ApplicationIntegrationType, ChannelType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { getGuildSettings, updateGuildSettings } from 'db/guild';

export default new Command({
  module: ModuleType.Config,
  data: new SlashCommandBuilder()
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setName('counting')
    .setDescription('A fun game for your community')
    .addSubcommand((cmd) =>
      cmd
        .setName('setup')
        .setDescription('Set up the counting game')
        .addChannelOption((option) =>
          option.setName('channel').setDescription('The channel where members should count in').addChannelTypes(ChannelType.GuildText).setRequired(true),
        )
        .addBooleanOption((option) => option.setName('reset-on-fail').setDescription('Reset the counting game on a failure').setRequired(false)),
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('edit')
        .setDescription('Edit your settings for the counting game')
        .addChannelOption((option) =>
          option.setName('channel').setDescription('The channel where members should count in').addChannelTypes(ChannelType.GuildText).setRequired(false),
        )
        .addBooleanOption((option) => option.setName('reset-on-fail').setDescription('Reset the counting game on a failure').setRequired(false)),
    )
    .addSubcommand((cmd) => cmd.setName('info').setDescription('Shows your settings and other stats for the counting game'))
    .addSubcommand((cmd) => cmd.setName('reset').setDescription('Resets all data of the counting game')),
  async execute({ client, interaction, lng}) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply();

    const { options, guildId } = interaction;

    const config = await getGuildSettings(guildId);

    switch (options.getSubcommand()) {
      case 'setup':
        {
          const channel = options.getChannel('channel', true);
          const resetOnFail = options.getBoolean('reset-on-fail', false) ?? false;

          if (config.counting.channelId) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('counting.already_setup', { lng }))],
            });
            return;
          }

          if (config.counting.channelId === channel.id) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('counting.already_channel', { lng }))],
            });
            return;
          }

          await updateGuildSettings(guildId, {
            $set: {
              ['counting.channelId']: channel.id,
              ['counting.resetOnFail']: resetOnFail,
              ['counting.currentNumber']: 0,
              ['counting.currentNumberAt']: null,
              ['counting.currentNumberBy']: null,
            },
          });

          await interaction.editReply({
            embeds: [
              new EmbedBuilder().setColor(client.colors.counting).setDescription(t('counting.setup_done', { lng, channel: channel.toString(), number: '1' })),
            ],
          });
        }
        break;
      case 'info':
        {
          if (!config.counting.channelId) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('counting.not_setup', { lng }))],
            });
            return;
          }

          await interaction.editReply({
            embeds: [
              new EmbedBuilder().setColor(client.colors.counting).addFields(
                { name: t('counting.channel', { lng }), value: `<#${config.counting.channelId}>` },
                {
                  name: t('counting.reset_on_fail', { lng }),
                  value: config.counting.resetOnFail ? t('enabled', { lng }) : t('disabled', { lng }),
                },
                {
                  name: t('counting.highest_number', { lng }),
                  value: config.counting.highestNumberAt
                    ? t('counting.highest_number_at', {
                        lng,
                        number: config.counting.highestNumber.toString(),
                        at: `<t:${Math.floor(config.counting.highestNumberAt / 1000)}:f>`,
                      })
                    : t('counting.highest_number_no_at', { lng, number: config.counting.highestNumber.toString() }),
                },
                {
                  name: t('counting.current_number', { lng }),
                  value: config.counting.currentNumberBy
                    ? t('counting.current_number_by', { lng, number: config.counting.currentNumber.toString(), by: `<@${config.counting.currentNumberBy}>` })
                    : t('counting.current_number_no_by', { lng, number: config.counting.currentNumber.toString() }),
                },
              ),
            ],
          });
        }
        break;
      case 'edit':
        {
          const channel = options.getChannel('channel', false, [ChannelType.GuildText]);
          const resetOnFail = options.getBoolean('reset-on-fail', false);

          if (!channel && !resetOnFail) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('counting.edit_nothing', { lng }))],
            });
            return;
          }

          let response = '';

          if (channel && channel.id !== config.counting.channelId) {
            await updateGuildSettings(guildId, {
              $set: {
                ['counting.channelId']: channel.id,
              },
            });
            response += t('counting.edit_channel', { lng, channel: `<#${channel.id}>` });
          }

          if (resetOnFail !== null && resetOnFail !== config.counting.resetOnFail) {
            await updateGuildSettings(guildId, {
              $set: {
                ['counting.resetOnFail']: resetOnFail,
              },
            });
            response += resetOnFail ? t('counting.edit_reset_on_fail_enabled', { lng }) : t('counting.edit_reset_on_fail_disabled', { lng });
          }

          if (response === '') {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('counting.edit_no_changes', { lng }))],
            });
            return;
          }

          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.counting).setDescription(response)],
          });
        }
        break;
      case 'reset':
        {
          if (!config.counting.channelId) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('counting.not_setup', { lng }))],
            });
            return;
          }

          await updateGuildSettings(guildId, {
            $set: {
              ['counting.channelId']: null,
              ['counting.resetOnFail']: false,
              ['counting.highestNumber']: 0,
              ['counting.highestNumberAt']: null,
              ['counting.currentNumber']: 0,
              ['counting.currentNumberBy']: null,
              ['counting.currentNumberAt']: null,
            },
          });

          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.counting).setDescription(t('counting.reset_done', { lng }))],
          });
        }
        break;
    }
  },
});

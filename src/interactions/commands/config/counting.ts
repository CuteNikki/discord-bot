import { ApplicationIntegrationType, ChannelType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { getCounting, resetCounting, setupCounting, updateCounting } from 'db/counting';

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
          option.setName('channel').setDescription('The channel where members should count in').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addBooleanOption((option) => option.setName('reset-on-fail').setDescription('Reset the counting game on a failure').setRequired(false))
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('edit')
        .setDescription('Edit your settings for the counting game')
        .addChannelOption((option) =>
          option.setName('channel').setDescription('The channel where members should count in').addChannelTypes(ChannelType.GuildText).setRequired(false)
        )
        .addBooleanOption((option) => option.setName('reset-on-fail').setDescription('Reset the counting game on a failure').setRequired(false))
    )
    .addSubcommand((cmd) => cmd.setName('info').setDescription('Shows your settings and other stats for the counting game'))
    .addSubcommand((cmd) => cmd.setName('reset').setDescription('Resets all data of the counting game')),
  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild()) return;
    await interaction.deferReply();

    const { options, guildId } = interaction;

    const counting = (await getCounting(guildId)) ?? {
      channelId: null,
      currentNumber: 0,
      currentNumberAt: null,
      currentNumberBy: null,
      highestNumber: 0,
      highestNumberAt: null,
      resetOnFail: false
    };

    switch (options.getSubcommand()) {
      case 'setup':
        {
          const channel = options.getChannel('channel', true);
          const resetOnFail = options.getBoolean('reset-on-fail', false) ?? false;

          if (counting.channelId) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('counting.already-setup', { lng }))]
            });
            return;
          }

          if (counting.channelId === channel.id) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('counting.already-channel', { lng }))]
            });
            return;
          }

          await setupCounting(guildId, channel.id, resetOnFail);

          await interaction.editReply({
            embeds: [
              new EmbedBuilder().setColor(client.colors.counting).setDescription(t('counting.setup-done', { lng, channel: channel.toString(), number: '1' }))
            ]
          });
        }
        break;
      case 'info':
        {
          if (!counting.channelId) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('counting.not-setup', { lng }))]
            });
            return;
          }

          await interaction.editReply({
            embeds: [
              new EmbedBuilder().setColor(client.colors.counting).addFields(
                { name: t('counting.channel', { lng }), value: `<#${counting.channelId}>` },
                {
                  name: t('counting.reset-on-fail', { lng }),
                  value: counting.resetOnFail ? t('enabled', { lng }) : t('disabled', { lng })
                },
                {
                  name: t('counting.highest-number', { lng }),
                  value: counting.highestNumberAt
                    ? t('counting.highest-number-at', {
                        lng,
                        number: counting.highestNumber.toString(),
                        at: `<t:${Math.floor(counting.highestNumberAt / 1000)}:f>`
                      })
                    : t('counting.highest-number-no-at', { lng, number: counting.highestNumber.toString() })
                },
                {
                  name: t('counting.current-number', { lng }),
                  value: counting.currentNumberBy
                    ? t('counting.current-number-by', { lng, number: counting.currentNumber.toString(), by: `<@${counting.currentNumberBy}>` })
                    : t('counting.current-number-no-by', { lng, number: counting.currentNumber.toString() })
                }
              )
            ]
          });
        }
        break;
      case 'edit':
        {
          const channel = options.getChannel('channel', false, [ChannelType.GuildText]);
          const resetOnFail = options.getBoolean('reset-on-fail', false);

          if (!channel && !resetOnFail) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('counting.edit-nothing', { lng }))]
            });
            return;
          }

          let response = '';

          if (channel && channel.id !== counting.channelId) {
            response += t('counting.edit-channel', { lng, channel: channel.toString() });
          }

          if (resetOnFail !== null && resetOnFail !== counting.resetOnFail) {
            response += resetOnFail ? t('counting.edit-reset-on-fail-enabled', { lng }) : t('counting.edit-reset-on-fail-disabled', { lng });
          }

          if (response === '') {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('counting.edit-no-changes', { lng }))]
            });
            return;
          }

          await updateCounting(guildId, channel?.id ?? counting.channelId, resetOnFail ?? counting.resetOnFail);

          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.counting).setDescription(response)]
          });
        }
        break;
      case 'reset':
        {
          if (!counting.channelId) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('counting.not-setup', { lng }))]
            });
            return;
          }

          await resetCounting(guildId);

          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.counting).setDescription(t('counting.reset-done', { lng }))]
          });
        }
        break;
    }
  }
});

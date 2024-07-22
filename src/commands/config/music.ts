import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

export default new Command({
  module: ModuleType.Config,
  data: new SlashCommandBuilder()
    .setName('config-music')
    .setDescription('Configure the music module')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .addSubcommandGroup((group) =>
      group
        .setName('show')
        .setDescription('Shows the current configuration')
        .addSubcommand((subcommand) => subcommand.setName('all').setDescription('Shows the entire configuration'))
        .addSubcommand((subcommand) => subcommand.setName('state').setDescription('Shows the music module state'))
    )
    .addSubcommandGroup((group) =>
      group
        .setName('toggle')
        .setDescription('Toggle the music module')
        .addSubcommand((subcommand) => subcommand.setName('on').setDescription('Turns the music module on'))
        .addSubcommand((subcommand) => subcommand.setName('off').setDescription('Turns the music module off'))
    ),
  async execute({ client, interaction }) {
    if (!interaction.inCachedGuild()) return;
    const { options, guildId } = interaction;
    await interaction.deferReply({ ephemeral: true });
    const lng = await client.getUserLanguage(interaction.user.id);

    const config = await client.getGuildSettings(guildId);

    switch (options.getSubcommandGroup()) {
      case 'show': {
        switch (options.getSubcommand()) {
          case 'all': {
            const allConfigEmbed = new EmbedBuilder()
              .setColor(Colors.Orange)
              .setTitle(t('music.config.title', { lng }))
              .addFields({
                name: t('music.config.state.title', { lng }),
                value: config.music.enabled ? t('music.config.state.enabled', { lng }) : t('music.config.state.disabled', { lng }),
              });
            await interaction.editReply({ embeds: [allConfigEmbed] });
            break;
          }
          case 'state': {
            await interaction.editReply({
              embeds: [
                new EmbedBuilder()
                  .setColor(Colors.Blurple)
                  .setTitle(t('music.config.title', { lng }))
                  .addFields({
                    name: t('music.config.state.title', { lng }),
                    value: config.music.enabled ? t('music.config.state.enabled', { lng }) : t('music.config.state.disabled', { lng }),
                  }),
              ],
            });
            break;
          }
        }
        break;
      }
      case 'toggle': {
        switch (options.getSubcommand()) {
          case 'on': {
            if (config.music.enabled) return interaction.editReply(t('music.config.toggle.already_on', { lng }));
            await client.updateGuildSettings(guildId, { $set: { 'music.enabled': true } });
            await interaction.editReply(t('music.config.toggle.on', { lng }));
            break;
          }
          case 'off': {
            if (!config.music.enabled) return interaction.editReply(t('music.config.toggle.already_off', { lng }));
            await client.updateGuildSettings(guildId, { $set: { 'music.enabled': false } });
            await interaction.editReply(t('music.config.toggle.off', { lng }));
            break;
          }
        }
        break;
      }
    }
  },
});

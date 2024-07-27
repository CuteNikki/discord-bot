import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

export default new Command({
  module: ModuleType.Config,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('config-moderation')
    .setDescription('Configure the moderation module')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addSubcommandGroup((group) =>
      group
        .setName('show')
        .setDescription('Shows the current configuration')
        .addSubcommand((subcommand) => subcommand.setName('all').setDescription('Shows the entire configuration'))
        .addSubcommand((subcommand) => subcommand.setName('state').setDescription('Shows the moderation module state'))
    )
    .addSubcommandGroup((group) =>
      group
        .setName('toggle')
        .setDescription('Toggle the moderation module')
        .addSubcommand((subcommand) => subcommand.setName('on').setDescription('Turns the moderation module on'))
        .addSubcommand((subcommand) => subcommand.setName('off').setDescription('Turns the moderation module off'))
    ),
  async execute({ client, interaction }) {
    if (!interaction.inCachedGuild()) return;
    const { options, guildId } = interaction;
    await interaction.deferReply({ ephemeral: true });
    const lng = await client.getUserLanguage(interaction.user.id);

    const config = await client.getGuildSettings(guildId);

    switch (options.getSubcommandGroup()) {
      case 'show':
        {
          switch (options.getSubcommand()) {
            case 'all':
              {
                const allConfigEmbed = new EmbedBuilder()
                  .setColor(Colors.Orange)
                  .setTitle(t('moderation.title', { lng }))
                  .addFields({
                    name: t('moderation.state.title', { lng }),
                    value: config.moderation.enabled ? t('moderation.state.enabled', { lng }) : t('moderation.state.disabled', { lng }),
                  });
                interaction.editReply({ embeds: [allConfigEmbed] });
              }
              break;
            case 'state':
              {
                interaction.editReply({
                  embeds: [
                    new EmbedBuilder()
                      .setColor(Colors.Blurple)
                      .setTitle(t('moderation.title', { lng }))
                      .addFields({
                        name: t('moderation.state.title', { lng }),
                        value: config.moderation.enabled ? t('moderation.state.enabled', { lng }) : t('moderation.state.disabled', { lng }),
                      }),
                  ],
                });
              }
              break;
          }
        }
        break;
      case 'toggle':
        {
          switch (options.getSubcommand()) {
            case 'on':
              {
                if (config.moderation.enabled) return interaction.editReply(t('moderation.toggle.already_on', { lng }));
                await client.updateGuildSettings(guildId, { $set: { ['moderation.enabled']: true } });
                interaction.editReply(t('moderation.toggle.on', { lng }));
              }
              break;
            case 'off':
              {
                if (!config.moderation.enabled) return interaction.editReply(t('moderation.toggle.already_off', { lng }));
                await client.updateGuildSettings(guildId, { $set: { ['moderation.enabled']: false } });
                interaction.editReply(t('moderation.toggle.off', { lng }));
              }
              break;
          }
        }
        break;
    }
  },
});

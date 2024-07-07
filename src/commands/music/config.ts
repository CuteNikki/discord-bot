import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

export default new Command({
  module: ModuleType.CONFIG,
  data: {
    name: 'config-music',
    description: 'Configure the music module',
    default_member_permissions: `${PermissionFlagsBits.ManageGuild}`,
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD],
    integration_types: [IntegrationTypes.GUILD_INSTALL],
    options: [
      {
        name: 'show',
        description: 'Shows the current configuration',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'all',
            description: 'Shows the entire configuration',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'state',
            description: 'Shows the music module state',
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
      {
        name: 'toggle',
        description: 'Toggle the music module',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'on',
            description: 'Turns the music module on',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'off',
            description: 'Turns the music module off',
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
    ],
  },
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
                  .setTitle(i18next.t('music.config.title', { lng }))
                  .addFields({
                    name: i18next.t('music.config.state.title', { lng }),
                    value: config.music.enabled ? i18next.t('music.config.state.enabled', { lng }) : i18next.t('music.config.state.disabled', { lng }),
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
                      .setTitle(i18next.t('music.config.title', { lng }))
                      .addFields({
                        name: i18next.t('music.config.state.title', { lng }),
                        value: config.music.enabled ? i18next.t('music.config.state.enabled', { lng }) : i18next.t('music.config.state.disabled', { lng }),
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
                if (config.music.enabled) return interaction.editReply(i18next.t('music.config.toggle.already_on', { lng }));
                await client.updateGuildSettings(guildId, { $set: { ['music.enabled']: true } });
                interaction.editReply(i18next.t('music.config.toggle.on', { lng }));
              }
              break;
            case 'off':
              {
                if (!config.music.enabled) return interaction.editReply(i18next.t('music.config.toggle.already_off', { lng }));
                await client.updateGuildSettings(guildId, { $set: { ['music.enabled']: false } });
                interaction.editReply(i18next.t('music.config.toggle.off', { lng }));
              }
              break;
          }
        }
        break;
    }
  },
});

import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';

import { guildModel } from 'models/guild';

export default new Command({
  module: Modules.CONFIG,
  data: {
    name: 'config-moderation',
    description: 'Configure the moderation module',
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
            description: 'Shows the moderation module state',
            type: ApplicationCommandOptionType.Subcommand,
          },
        ],
      },
      {
        name: 'toggle',
        description: 'Toggle the moderation module',
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'on',
            description: 'Turns the moderation module on',
            type: ApplicationCommandOptionType.Subcommand,
          },
          {
            name: 'off',
            description: 'Turns the moderation module off',
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
    const lng = await client.getLanguage(interaction.user.id);

    const config = await client.getGuildSettings(guildId);

    switch (options.getSubcommandGroup()) {
      case 'show':
        {
          switch (options.getSubcommand()) {
            case 'all':
              {
                const allConfigEmbed = new EmbedBuilder()
                  .setColor(Colors.Orange)
                  .setTitle(i18next.t('moderation.title', { lng }))
                  .addFields({
                    name: i18next.t('moderation.state.title', { lng }),
                    value: config.moderation.enabled ? i18next.t('moderation.state.enabled', { lng }) : i18next.t('moderation.state.disabled', { lng }),
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
                      .setTitle(i18next.t('moderation.title', { lng }))
                      .addFields({
                        name: i18next.t('moderation.state.title', { lng }),
                        value: config.moderation.enabled ? i18next.t('moderation.state.enabled', { lng }) : i18next.t('moderation.state.disabled', { lng }),
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
                if (config.moderation.enabled) return interaction.editReply(i18next.t('moderation.toggle.already_on', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $set: { ['moderation.enabled']: true } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('moderation.toggle.on', { lng }));
              }
              break;
            case 'off':
              {
                if (!config.moderation.enabled) return interaction.editReply(i18next.t('moderation.toggle.already_off', { lng }));
                const newSettings = await guildModel
                  .findOneAndUpdate({ guildId }, { $set: { ['moderation.enabled']: false } }, { new: true, upsert: true })
                  .lean()
                  .exec();
                client.guildSettings.set(guildId, newSettings);
                interaction.editReply(i18next.t('moderation.toggle.off', { lng }));
              }
              break;
          }
        }
        break;
    }
  },
});

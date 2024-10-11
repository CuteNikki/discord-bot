import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, PermissionFlagsBits, roleMention, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { disableModeration, enableModeration, getModeration, makeReasonsOptional, makeReasonsRequired, setStaffrole } from 'db/moderation';

export default new Command({
  module: ModuleType.Config,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('moderation')
    .setDescription('Configure the moderation module')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((cmd) => cmd.setName('enable').setDescription('Enables the moderation module'))
    .addSubcommand((cmd) => cmd.setName('disable').setDescription('Disables the moderation module'))
    .addSubcommand((cmd) => cmd.setName('info').setDescription('Shows the current moderation settings'))
    .addSubcommand((cmd) => cmd.setName('reasons-required').setDescription('Makes reasons for bans, kicks, etc. required'))
    .addSubcommand((cmd) => cmd.setName('reasons-optional').setDescription('Makes reasons for bans, kicks, etc. optional'))
    .addSubcommand((cmd) =>
      cmd
        .setName('staffrole')
        .setDescription('Sets the staff role for moderation')
        .addRoleOption((option) => option.setName('role').setDescription('The staff role').setRequired(true))
    ),
  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const { options, guildId } = interaction;

    const config = (await getModeration(guildId)) ?? { enabled: false, reasonsRequired: false, staffroleId: undefined };

    switch (options.getSubcommand()) {
      case 'enable':
        {
          if (config.enabled) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('moderation.state.already-enabled', { lng }))]
            });
            return;
          }

          await enableModeration(guildId);
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.moderation).setDescription(t('moderation.state.enabled', { lng }))]
          });
        }
        break;
      case 'disable':
        {
          if (!config.enabled) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('moderation.state.already-disabled', { lng }))]
            });
            return;
          }

          await disableModeration(guildId);
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.moderation).setDescription(t('moderation.state.disabled', { lng }))]
          });
        }
        break;
      case 'info':
        {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.moderation)
                .setTitle(t('moderation.title', { lng }))
                .addFields(
                  {
                    name: t('moderation.state.title', { lng }),
                    value: config.enabled ? t('enabled', { lng }) : t('disabled', { lng })
                  },
                  {
                    name: t('moderation.reasons.title', { lng }),
                    value: config.reasonsRequired ? t('enabled', { lng }) : t('disabled', { lng })
                  },
                  {
                    name: t('moderation.staffrole.title', { lng }),
                    value: config.staffroleId ? roleMention(config.staffroleId) : t('none', { lng })
                  }
                )
            ]
          });
        }
        break;
      case 'require-reasons':
        {
          if (config.reasonsRequired) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('moderation.reasons.already-required', { lng }))]
            });
            return;
          }

          await makeReasonsRequired(guildId);
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.moderation).setDescription(t('moderation.reasons.required', { lng }))]
          });
        }
        break;
      case 'optional-reasons':
        {
          if (!config.reasonsRequired) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('moderation.reasons.already-optional', { lng }))]
            });
            return;
          }

          await makeReasonsOptional(guildId);
          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.moderation).setDescription(t('moderation.reasons.optional', { lng }))]
          });
        }
        break;
      case 'staffrole':
        {
          const role = options.getRole('role', true);

          if (role.id === config.staffroleId) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('moderation.staffrole.already-set', { lng, role: role.toString() }))]
            });
            return;
          }

          const warnings: string[] = [];

          if (!role.permissions.has(PermissionFlagsBits.BanMembers)) {
            warnings.push(t('moderation.staffrole.no-ban', { lng }));
          }

          if (!role.permissions.has(PermissionFlagsBits.KickMembers)) {
            warnings.push(t('moderation.staffrole.no-kick', { lng }));
          }

          if (!role.permissions.has(PermissionFlagsBits.ManageMessages)) {
            warnings.push(t('moderation.staffrole.no-manage-messages', { lng }));
          }

          if (!role.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            warnings.push(t('moderation.staffrole.no-moderate', { lng }));
          }

          await setStaffrole(guildId, role.id);

          const embeds = [new EmbedBuilder().setColor(client.colors.moderation).setDescription(t('moderation.staffrole.set', { lng, role: role.toString() }))];

          if (warnings.length) {
            embeds.push(new EmbedBuilder().setColor(client.colors.warning).setDescription(warnings.join('\n')));
          }

          await interaction.editReply({ embeds });
        }
        break;
    }
  }
});

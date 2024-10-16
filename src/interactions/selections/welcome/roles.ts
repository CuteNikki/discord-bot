import { ActionRowBuilder, EmbedBuilder, RoleSelectMenuBuilder } from 'discord.js';
import { t } from 'i18next';

import { Selection } from 'classes/selection';

import { updateWelcome } from 'db/welcome';

import { ModuleType } from 'types/interactions';

export default new Selection({
  module: ModuleType.Config,
  customId: 'selection-welcome-roles',
  permissions: ['ManageGuild'],
  async execute({ client, interaction, lng }) {
    if (!interaction.inCachedGuild() || !interaction.isRoleSelectMenu()) {
      return;
    }

    await interaction.deferUpdate();

    const updatedWelcome = await updateWelcome(interaction.guildId, {
      $set: {
        roles: interaction.roles
          .filter((r) => !r.managed)
          .sort((a, b) => b.position - a.position)
          .map((r) => r.id)
      }
    });

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.welcome)
          .setTitle(t('welcome.roles.title', { lng }))
          .setDescription(
            updatedWelcome.roles.length
              ? updatedWelcome.roles
                  .map((r) => {
                    const role = interaction.guild.roles.cache.get(r);
                    return role ? role.toString() : r;
                  })
                  .join('\n')
              : t('none', { lng })
          )
      ],
      components: [
        new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
          new RoleSelectMenuBuilder()
            .setCustomId('selection-welcome-roles')
            .setDefaultRoles(updatedWelcome.roles)
            .setMinValues(0)
            .setMaxValues(15)
            .setPlaceholder(t('welcome.roles.placeholder', { lng }))
        )
      ]
    });
  }
});

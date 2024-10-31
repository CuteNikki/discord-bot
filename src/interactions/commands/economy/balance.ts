import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { getUser } from 'db/user';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Economy,
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription("Check your own or someone else's balance")
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.BotDM, InteractionContextType.PrivateChannel, InteractionContextType.Guild)
    .addUserOption((option) => option.setName('user').setDescription('The user to check the balance of'))
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('Whether the response should be ephemeral')),
  async execute({ interaction, client, lng }) {
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? true;

    await interaction.deferReply({ ephemeral });

    const user = interaction.options.getUser('user') ?? interaction.user;

    const userData = (await getUser(user.id, user.id === interaction.user.id)) ?? { bank: 0, wallet: 0 };

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.economy)
          .setAuthor({ name: t('balance.title', { lng, user: user.username }), iconURL: user.displayAvatarURL() })
          .addFields(
            {
              name: t('balance.wallet', { lng }),
              value: `$${userData.wallet}`
            },
            {
              name: t('balance.bank', { lng }),
              value: `$${userData.bank}`
            }
          )
      ]
    });
  }
});

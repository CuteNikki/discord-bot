import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder
} from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { economyOboarded, getUser } from 'db/user';

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

    await interaction.deferReply({ flags: ephemeral ? [MessageFlags.Ephemeral] : undefined });

    const user = interaction.options.getUser('user') ?? interaction.user;

    if (user.bot) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('balance.bot', { lng }))]
      });
      return;
    }

    let userData = (await getUser(user.id, user.id === interaction.user.id)) ?? { bank: 0, wallet: 0, economyOnboarding: true };

    if (userData.economyOnboarding && user.id === interaction.user.id) {
      userData = await economyOboarded(user.id);
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.economy)
          .setAuthor({ name: t('balance.title', { lng, user: user.displayName }), iconURL: user.displayAvatarURL() })
          .addFields(
            {
              name: t('balance.bank', { lng }),
              value: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(userData.bank)
            },
            {
              name: t('balance.wallet', { lng }),
              value: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(userData.wallet)
            }
          )
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder().setCustomId(`button-balance-refresh_${user.id}`).setEmoji('🔄').setStyle(ButtonStyle.Secondary)
        )
      ]
    });
  }
});

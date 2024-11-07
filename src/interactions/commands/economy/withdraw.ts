import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { getUser, withdraw } from 'db/user';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Economy,
  data: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Withdraw money from your bank')
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addStringOption((option) => option.setName('amount').setDescription('Amount of money to withdraw').setRequired(true)),
  async execute({ client, interaction, lng }) {
    const amountStr = interaction.options.getString('amount', true);
    let amount: number;

    const userData = (await getUser(interaction.user.id)) ?? { bank: 0 };

    if (amountStr.toLowerCase() === 'all') {
      amount = userData.bank;
    } else {
      amount = parseInt(amountStr, 10);
      if (isNaN(amount) || amount <= 0) {
        interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('withdraw.invalid', { lng }))],
          ephemeral: true
        });
        return;
      }
    }

    if (userData.bank < amount) {
      interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('withdraw.insufficient', { lng }))],
        ephemeral: true
      });
      return;
    }

    await withdraw(interaction.user.id, amount);

    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.economy)
          .setDescription(t('withdraw.success', { lng, amount: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount) }))
      ],
      ephemeral: true
    });
  }
});

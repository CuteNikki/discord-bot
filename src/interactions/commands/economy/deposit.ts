import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { deposit, getUser } from 'db/user';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Economy,
  data: new SlashCommandBuilder()
    .setName('deposit')
    .setDescription('Deposit money into your bank')
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addStringOption((option) => option.setName('amount').setDescription('Amount of money to deposit').setRequired(true)),
  async execute({ client, interaction, lng }) {
    const amountStr = interaction.options.getString('amount', true);
    let amount: number;

    const userData = (await getUser(interaction.user.id)) ?? { wallet: 0 };

    if (amountStr.toLowerCase() === 'all') {
      amount = userData.wallet;
    } else {
      amount = parseInt(amountStr, 10);
      if (isNaN(amount) || amount <= 0) {
        interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('deposit.invalid', { lng }))],
          ephemeral: true
        });
        return;
      }
    }

    if (userData.wallet < amount) {
      interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('deposit.insufficient', { lng }))],
        ephemeral: true
      });
      return;
    }

    await deposit(interaction.user.id, amount);

    interaction.reply({
      embeds: [new EmbedBuilder().setColor(client.colors.economy).setDescription(t('deposit.success', { lng, amount }))],
      ephemeral: true
    });
  }
});

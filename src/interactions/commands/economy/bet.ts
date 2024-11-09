import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { addBank, getUser, removeBank } from 'db/user';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Economy,
  data: new SlashCommandBuilder()
    .setName('bet')
    .setDescription('Bet your money to earn more!')
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addIntegerOption((option) =>
      option.setName('amount').setDescription('The amount of money you want to bet').setMinValue(1).setMaxValue(50_000).setRequired(true)
    ),
  async execute({ client, interaction, lng }) {
    const amount = interaction.options.getInteger('amount', true);

    if (amount <= 0) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('bet.invalid', { lng }))], ephemeral: true });
    }

    const userData = await getUser(interaction.user.id);
    if ((userData?.bank ?? 0) < amount) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('bet.insufficient', { lng }))], ephemeral: true });
    }

    const win = Math.random() < 0.5;

    if (win) {
      await addBank(interaction.user.id, amount);
    } else {
      await removeBank(interaction.user.id, amount);
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(win ? Colors.Green : Colors.Red)
          .setDescription(t(win ? 'bet.win' : 'bet.lose', { amount: Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(amount), lng }))
      ]
    });
  }
});

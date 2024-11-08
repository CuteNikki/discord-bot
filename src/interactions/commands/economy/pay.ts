import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { addBank, getUser, removeBank } from 'db/user';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Economy,
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Pay someone money')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .addUserOption((option) => option.setName('user').setDescription('The user you want to pay').setRequired(true))
    .addIntegerOption((option) => option.setName('amount').setDescription('The amount of money you want to pay').setMinValue(1).setRequired(true)),
  async execute({ client, interaction, lng }) {
    const user = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount', true);

    if (user.bot) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('pay.bot', { lng }))], ephemeral: true });
      return;
    }

    if (user.id === interaction.user.id) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('pay.self', { lng }))], ephemeral: true });
      return;
    }

    if (amount <= 0) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('pay.invalid', { lng }))], ephemeral: true });
      return;
    }

    const userData = await getUser(interaction.user.id, true);

    if (userData.bank < amount) {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('pay.insufficient', { lng }))], ephemeral: true });
      return;
    }

    await removeBank(interaction.user.id, amount);
    await addBank(user.id, amount);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.economy)
          .setDescription(
            t('pay.success', { lng, amount: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount), user: user.toString() })
          )
      ],
    });
  }
});

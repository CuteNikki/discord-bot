import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { addMoney, getUser, removeMoney } from 'db/user';

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

    if (user.id === interaction.user.id) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('pay.self', { lng }))], ephemeral: true });
    }

    if (amount <= 0) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('pay.invalid', { lng }))], ephemeral: true });
    }

    const userData = await getUser(interaction.user.id, true);

    if (userData.wallet < amount) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('pay.insufficient', { lng }))], ephemeral: true });
    }

    await removeMoney(interaction.user.id, amount);
    await addMoney(user.id, amount);

    return interaction.reply({
      embeds: [new EmbedBuilder().setColor(client.colors.economy).setDescription(t('pay.success', { lng, amount, user: user.toString() }))],
      ephemeral: true
    });
  }
});

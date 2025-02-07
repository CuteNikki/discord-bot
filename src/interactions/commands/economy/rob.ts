import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder, time, TimestampStyles } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { addMoney, getUser, hasRobbed, removeMoney } from 'db/user';

import { getRandomNumber } from 'utils/common';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Economy,
  cooldown: 0, // We have another cooldown for robbing, which is stored in the database
  data: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Rob a user')
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addUserOption((option) => option.setName('user').setDescription('The user you want to rob').setRequired(true)),
  async execute({ client, interaction, lng }) {
    const user = interaction.options.getUser('user', true);

    if (user.id === interaction.user.id) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('rob.self', { lng }))],
        flags: [MessageFlags.Ephemeral]
      });
    }

    if (user.bot) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('rob.bot', { lng }))],
        flags: [MessageFlags.Ephemeral]
      });
    }

    const targetData = await getUser(user.id);

    if (!targetData?.wallet || targetData.wallet < 1) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('rob.none', { lng, target: user.toString() }))],
        flags: [MessageFlags.Ephemeral]
      });
    }

    const userData = await getUser(interaction.user.id);

    const cooldown = 1000 * 60 * 60; // 1 hour
    const now = Date.now();
    const timeLeft = (userData?.lastRob ?? 0) + cooldown - now;

    if (timeLeft > 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.colors.error)
            .setDescription(t('rob.cooldown', { lng, left: time(Math.floor((now + timeLeft) / 1000), TimestampStyles.RelativeTime) }))
        ],
        flags: [MessageFlags.Ephemeral]
      });
    }

    await hasRobbed(interaction.user.id, now);

    // 1 in 5 chance of failing (20%)

    const successChance = getRandomNumber(1, 5);

    if (successChance === 1) {
      let randomAmount = 0;

      if (userData?.wallet && userData.wallet < 1) {
        const randomPercentage = getRandomNumber(10, 25);
        randomAmount = (randomPercentage / 100) * targetData.wallet;
        await removeMoney(interaction.user.id, randomAmount);
      } else if (userData?.bank && userData.bank < 1) {
        const randomPercentage = getRandomNumber(5, 10);
        randomAmount = (randomPercentage / 100) * targetData.wallet;
        await removeMoney(interaction.user.id, randomAmount);
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.colors.error)
            .setDescription(t('rob.fail', { lng, amount: Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(randomAmount) }))
        ]
      });
    }

    const randomPercentage = getRandomNumber(10, 50);
    const randomAmount = (randomPercentage / 100) * targetData.wallet;

    await removeMoney(user.id, randomAmount);
    await addMoney(interaction.user.id, randomAmount);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.success)
          .setDescription(
            t('rob.success', { lng, target: user.toString(), amount: Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(randomAmount) })
          )
      ]
    });
  }
});

import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { addBadge, addBank, getUser, removeBank } from 'db/user';

import { ModuleType } from 'types/interactions';
import { BadgeType } from 'types/user';

const MIN_AMOUNT = 1;
const MAX_AMOUNT = 5_000;

export default new Command({
  module: ModuleType.Economy,
  cooldown: 6000,
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin')
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addStringOption((option) =>
      option
        .setName('choice')
        .setDescription('Choose heads or tails')
        .setChoices({ name: 'heads', value: 'heads' }, { name: 'tails', value: 'tails' })
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option.setName('amount').setDescription('Amount of money to bet').setMinValue(MIN_AMOUNT).setMaxValue(MAX_AMOUNT).setRequired(false)
    ),
  async execute({ client, interaction, lng }) {
    const choice = interaction.options.getString('choice') ?? ['heads', 'tails'][Math.floor(Math.random() * 2)];
    const amount = interaction.options.getInteger('amount') ?? 0;

    const userData = (await getUser(interaction.user.id)) ?? { bank: 0, badges: [] };
    const hasBadge = userData.badges.map((b) => b.id).includes(BadgeType.Coinflipper);

    const random = Math.random();
    const win = !hasBadge && random < 0.001 ? 'edge' : ['heads', 'tails'][Math.floor(Math.random() * 2)];
    const hasWon = choice === win;

    const message = await interaction
      .reply({
        embeds: [new EmbedBuilder().setColor(client.colors.economy).setDescription(t('coinflip.flipping', { lng }))],
        fetchReply: true
      })
      .catch(() => {});

    if (!message) {
      return;
    }

    if (amount >= MIN_AMOUNT && amount < MAX_AMOUNT) {
      if (userData.bank < amount) {
        return;
      }

      if (hasWon) {
        await addBank(interaction.user.id, amount);
      } else {
        await removeBank(interaction.user.id, amount);
      }
    }

    const responseKey =
      win === 'edge' ? 'coinflip.edge' : hasWon ? (amount > 0 ? 'coinflip.win-money' : 'coinflip.win') : amount > 0 ? 'coinflip.lose-money' : 'coinflip.lose';

    if (!hasBadge && win === 'edge') {
      await addBadge(interaction.user.id, BadgeType.Coinflipper);
    }

    setTimeout(() => {
      message
        .edit({
          embeds: [
            new EmbedBuilder()
              .setColor(win === 'edge' ? Colors.Gold : hasWon ? Colors.Green : Colors.Red)
              .setDescription(t(responseKey, { amount: Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(amount), choice, win, lng }))
          ]
        })
        .catch(() => {});
    }, 1500);
  }
});

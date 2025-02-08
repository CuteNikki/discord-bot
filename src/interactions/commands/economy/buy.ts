import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { ModuleType } from 'types/interactions';

import { keys } from 'constants/keys';

import { getClientSettings, setupDefaultShop } from 'db/client';
import { addItems, getUser, removeBank } from 'db/user';

export default new Command({
  module: ModuleType.Economy,
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy an item from the shop')
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addStringOption((option) => option.setName('item').setDescription('Item to buy').setRequired(true))
    .addIntegerOption((option) => option.setName('amount').setDescription('Amount of items to buy').setMinValue(1).setRequired(false)),
  async execute({ client, interaction, lng }) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const item = interaction.options.getString('item', true);
    const amount = interaction.options.getInteger('amount') ?? 1;

    let settings = await getClientSettings(keys.DISCORD_BOT_ID, true);
    if (!settings.shop?.length) {
      settings = await setupDefaultShop(keys.DISCORD_BOT_ID);
    }
    const items = settings.shop;

    const foundItem = items.find(
      (i) =>
        i.name.toLowerCase() === item.toLowerCase() ||
        i.name.split(' ').join('_').toLowerCase() === item.toLowerCase() ||
        i.name.split(' ').join('-').toLowerCase() === item.toLowerCase() ||
        i.name.split(' ').join('').toLowerCase() === item.toLowerCase() ||
        String(i.id) === item
    );

    if (!foundItem) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('buy.invalid', { lng }))]
      });
    }

    if (amount < 1) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('buy.invalid', { lng }))]
      });
    }

    const price = foundItem.buyPrice * amount;
    const userData = await getUser(interaction.user.id, true);

    if (userData.bank < price) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('buy.insufficient', { lng }))]
      });
    }

    await removeBank(interaction.user.id, price);
    await addItems(interaction.user.id, new Array(amount).fill(foundItem));

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.economy)
          .setDescription(
            t('buy.success', { lng, item: foundItem.name, amount, price: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price) })
          )
      ]
    });
  }
});

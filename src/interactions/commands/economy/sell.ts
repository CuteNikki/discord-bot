import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { ModuleType } from 'types/interactions';

import { keys } from 'constants/keys';

import { getClientSettings, setupDefaultShop } from 'db/client';
import { addBank, getUser, removeItems } from 'db/user';

export default new Command({
  module: ModuleType.Economy,
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sell an item to the shop')
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addStringOption((option) => option.setName('item').setDescription('Item to sell').setRequired(true))
    .addIntegerOption((option) => option.setName('amount').setDescription('Amount of items to sell').setMinValue(1).setRequired(false)),
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
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('sell.invalid', { lng }))]
      });
    }

    if (amount < 1) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('sell.invalid', { lng }))]
      });
    }

    const userData = await getUser(interaction.user.id, true);

    if (userData.inventory.filter((i) => i.id === foundItem.id).length < amount) {
      return interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('sell.insufficient', { lng }))]
      });
    }

    const price = foundItem.sellPrice * amount;

    await removeItems(interaction.user.id, foundItem.id, amount);
    await addBank(interaction.user.id, price);

    return interaction.editReply({
      embeds: [
        new EmbedBuilder().setColor(client.colors.economy).setDescription(
          t('sell.success', {
            lng,
            item: foundItem.name,
            amount,
            price: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
          })
        )
      ]
    });
  }
});

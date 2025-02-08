import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { addItems, getUser, removeItems } from 'db/user';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Economy,
  data: new SlashCommandBuilder()
    .setName('transfer')
    .setDescription('Transfer items to another user')
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addStringOption((option) => option.setName('item').setDescription('Item to transfer').setRequired(true))
    .addUserOption((option) => option.setName('user').setDescription('User to transfer items to').setRequired(true))
    .addIntegerOption((option) => option.setName('amount').setDescription('Amount of items to transfer').setMinValue(1).setRequired(false)),
  async execute({ client, interaction, lng }) {
    const item = interaction.options.getString('item', true);
    const user = interaction.options.getUser('user', true);
    const amount = interaction.options.getInteger('amount') ?? 1;

    if (user.bot) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('transfer.bot', { lng }))],
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    if (amount < 1) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('transfer.invalid', { lng }))],
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    const { inventory } = (await getUser(interaction.user.id)) ?? { inventory: [] };

    const foundItems = inventory.filter(
      (i) =>
        i.name.toLowerCase() === item.toLowerCase() ||
        i.name.split(' ').join('_').toLowerCase() === item.toLowerCase() ||
        i.name.split(' ').join('-').toLowerCase() === item.toLowerCase() ||
        i.name.split(' ').join('').toLowerCase() === item.toLowerCase() ||
        String(i.id) === item
    );

    if (!foundItems.length) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('transfer.insufficient', { lng, item }))],
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    if (foundItems.length < amount) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('transfer.insufficient', { lng, item: foundItems[0].name }))],
        flags: [MessageFlags.Ephemeral]
      });
      return;
    }

    await removeItems(
      interaction.user.id,
      foundItems.slice(0, amount).map((i) => i.id)
    );

    await addItems(user.id, foundItems.slice(0, amount));

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.economy)
          .setDescription(t('transfer.success', { lng, amount, item: foundItems[0].name, user: user.toString() }))
      ]
    });
  }
});

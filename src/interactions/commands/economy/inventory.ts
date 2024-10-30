import { ApplicationIntegrationType, codeBlock, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { getUser } from 'db/user';

import { ModuleType } from 'types/interactions';
import type { Item, ItemType } from 'types/user';

export default new Command({
  module: ModuleType.Economy,
  isDeveloperOnly: true,
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription("View your or someone else's inventory.")
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addUserOption((option) => option.setName('user').setDescription('The user you want to view the inventory of'))
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('Whether the response should be ephemeral')),
  async execute({ interaction, lng }) {
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? true;

    await interaction.deferReply({ ephemeral });

    const user = interaction.options.getUser('user') ?? interaction.user;

    const { inventory } = (await getUser(user.id, user.id === interaction.user.id)) ?? { inventory: [] };

    if (!inventory?.length && user.id !== interaction.user.id) {
      interaction.editReply({ content: t('inventory.failed', { user: user.tag, lng }) });
      return;
    }

    if (!inventory?.length) {
      interaction.editReply({ content: t('inventory.empty', { lng }) });
      return;
    }

    // Create a map to count occurrences of each item
    const itemCounts = new Map<ItemType, { item: Item; count: number }>();

    inventory.forEach((item) => {
      if (itemCounts.has(item.id)) {
        itemCounts.get(item.id)!.count++;
      } else {
        itemCounts.set(item.id, { item, count: 1 });
      }
    });

    // Convert the map to an array of items with their counts
    const countedInventory = Array.from(itemCounts.values()).map(({ item, count }) => ({
      ...item,
      count
    }));

    interaction.editReply({ content: codeBlock('json', JSON.stringify(countedInventory, null, 2)) });
  }
});

import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { Command } from 'classes/command';

import { getClientSettings, setupDefaultShop } from 'db/client';

import { keys } from 'constants/keys';

import { ModuleType } from 'types/interactions';
import { ItemCategory } from 'types/user';

export default new Command({
  module: ModuleType.Economy,
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('View the shop')
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall),
  async execute({ client, interaction }) {
    await interaction.deferReply();

    let settings = await getClientSettings(keys.DISCORD_BOT_ID, true);

    if (!settings.shop?.length) {
      settings = await setupDefaultShop(keys.DISCORD_BOT_ID);
    }

    const items = settings.shop;

    const categories = items.map(({ category }) => category).filter((category, index, array) => array.indexOf(category) === index);

    const itemsByCategory = categories.map((category) => ({
      category,
      items: items.filter(({ category: c }) => c === category)
    }));

    const fields = itemsByCategory.flatMap(({ category, items }, index) => [
      {
        name: ItemCategory[category],
        value: items
          .map(
            ({ emoji, name, id, buyPrice, sellPrice }) =>
              `\`${emoji} ${name} (ID: ${id})\`\n📥 ${Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency', notation: 'compact' }).format(buyPrice)} 📤 ${Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency', notation: 'compact' }).format(sellPrice)}`
          )
          .join('\n\n'),
        inline: true
      },
      ...(index % 2 === 1 ? [{ name: '\u200b', value: '\u200b', inline: true }] : [])
    ]);

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.economy).addFields(fields)]
    });
  }
});

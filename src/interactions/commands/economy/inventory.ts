import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { economyOboarded, getUser } from 'db/user';

import { ModuleType } from 'types/interactions';
import { ItemCategory, type Item } from 'types/user';

export default new Command({
  module: ModuleType.Economy,
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription("View your or someone else's inventory.")
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addUserOption((option) => option.setName('user').setDescription('The user you want to view the inventory of'))
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('Whether the response should be ephemeral')),
  async execute({ interaction, lng, client }) {
    const ephemeral = interaction.options.getBoolean('ephemeral') ?? true;

    await interaction.deferReply({ flags: ephemeral ? [MessageFlags.Ephemeral] : undefined });

    const user = interaction.options.getUser('user') ?? interaction.user;

    if (user.bot) {
      interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('inventory.bot', { lng }))]
      });
      return;
    }

    let userData = (await getUser(user.id, user.id === interaction.user.id)) ?? { inventory: [], economyOnboarding: true };

    if (userData.economyOnboarding && user.id === interaction.user.id) {
      userData = await economyOboarded(user.id);
    }

    if (!userData.inventory?.length) {
      interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.colors.error)
            .setDescription(user.id === interaction.user.id ? t('inventory.empty', { lng }) : t('inventory.empty-other', { lng, user: user.toString() }))
        ]
      });
      return;
    }

    const items = (userData.inventory as (Item & { amount: number })[]).filter((item, index, array) => {
      const first = array.findIndex(({ id }) => item.id === id);

      if (first === index) return (item.amount = 1);
      else array[first].amount++;
    });

    const categories = items.map(({ category }) => category).filter((category, index, array) => array.indexOf(category) === index);

    const itemsByCategory = categories.map((category) => ({
      category,
      items: items.filter(({ category: c }) => c === category)
    }));

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.economy)
          .setAuthor({
            name: t('inventory.title', { lng, user: user.displayName }),
            iconURL: user.displayAvatarURL()
          })
          .addFields(
            itemsByCategory.map(({ category, items }) => ({
              name: ItemCategory[category],
              value: items.map(({ emoji, name, amount, id, description }) => `**${amount}x** \`${emoji} ${name} (ID: ${id})\`\n${description}`).join('\n')
            }))
          )
      ]
    });
  }
});

import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  ComponentType,
  EmbedBuilder,
  InteractionContextType,
  SlashCommandBuilder
} from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { getUser, marryUsers, removeItem } from 'db/user';

import { ModuleType } from 'types/interactions';
import { ItemType } from 'types/user';

enum CustomIds {
  Accept = 'button-marriage-accept',
  Decline = 'button-marriage-decline'
}

export default new Command({
  module: ModuleType.Economy,
  data: new SlashCommandBuilder()
    .setName('marry')
    .setDescription('Marry someone')
    .setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addUserOption((option) => option.setName('user').setDescription('User to marry').setRequired(true)),
  async execute({ client, interaction, lng }) {
    const user = interaction.options.getUser('user', true);

    if (user.id === interaction.user.id) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('marry.self', { lng }))], ephemeral: true });
    }

    if (user.bot) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('marry.bot', { lng }))], ephemeral: true });
    }

    const userData = await getUser(interaction.user.id);

    if (userData?.marriedTo) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('marry.already-user', { lng }))],
        ephemeral: true
      });
    }

    const targetData = await getUser(user.id);

    if (targetData?.marriedTo) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('marry.already-target', { lng, target: user.toString() }))],
        ephemeral: true
      });
    }

    const marriageRing = userData?.inventory.find((item) => item.id === ItemType.MarriageRing);

    if (!marriageRing) {
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('marry.ring', { lng }))],
        ephemeral: true
      });
    }

    const message = await interaction.reply({
      content: user.toString(),
      embeds: [new EmbedBuilder().setColor(client.colors.economy).setDescription(t('marry.confirm', { lng, user: interaction.user.toString() }))],
      components: [
        new ActionRowBuilder<ButtonBuilder>().setComponents(
          new ButtonBuilder().setCustomId(CustomIds.Accept).setLabel(t('marry.accept', { lng })).setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId(CustomIds.Decline).setLabel(t('marry.decline', { lng })).setStyle(ButtonStyle.Danger)
        )
      ]
    });

    const buttonInteraction = await message
      .awaitMessageComponent({ filter: (i) => i.user.id === user.id, time: 60000, componentType: ComponentType.Button })
      .catch(() => {});

    if (!buttonInteraction) {
      return interaction.editReply({
        content: interaction.user.toString(),
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('marry.timeout', { lng, target: user.toString() }))],
        components: []
      });
    }

    if (buttonInteraction.customId === CustomIds.Decline) {
      return buttonInteraction.update({
        content: interaction.user.toString(),
        embeds: [
          new EmbedBuilder()
            .setColor(client.colors.error)
            .setDescription(t('marry.declined', { lng, user: interaction.user.toString(), target: user.toString() }))
        ],
        components: []
      });
    }

    if (buttonInteraction.customId === CustomIds.Accept) {
      const newUserData = await getUser(interaction.user.id);

      if (!newUserData?.inventory.find((item) => item.id === ItemType.MarriageRing)) {
        return buttonInteraction.update({
          content: interaction.user.toString(),
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('marry.ring', { lng }))],
          components: []
        });
      }

      if (newUserData.marriedTo) {
        return buttonInteraction.update({
          content: user.toString(),
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('marry.already-target', { lng, target: interaction.user.toString() }))],
          components: []
        });
      }

      const newTargetData = await getUser(user.id);

      if (newTargetData?.marriedTo) {
        return buttonInteraction.update({
          content: interaction.user.toString(),
          embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(t('marry.already-target', { lng, target: user.toString() }))],
          components: []
        });
      }

      await removeItem(interaction.user.id, ItemType.MarriageRing);
      await marryUsers(interaction.user.id, user.id);

      return buttonInteraction.update({
        content: interaction.user.toString(),
        embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(t('marry.accepted', { lng, target: user.toString() }))],
        components: []
      });
    }
  }
});

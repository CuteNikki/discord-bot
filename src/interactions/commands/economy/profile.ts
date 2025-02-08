import {
  ApplicationIntegrationType,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
  time,
  TimestampStyles,
  type ColorResolvable
} from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { getUser, updateColor, updateDescription } from 'db/user';

import { getBadgeEmoji } from 'utils/common';
import { supportedLanguages } from 'utils/language';

import { ModuleType } from 'types/interactions';
import { BadgeType } from 'types/user';

export default new Command({
  module: ModuleType.Economy,
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View profiles or edit yours')
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addSubcommandGroup((group) =>
      group
        .setName('edit')
        .setDescription('Edit your profile')
        .addSubcommand((cmd) =>
          cmd
            .setName('description')
            .setDescription('Edit your profile description')
            .addStringOption((option) => option.setName('description').setDescription('The new description').setMaxLength(500).setRequired(false))
        )
        .addSubcommand((cmd) =>
          cmd
            .setName('color')
            .setDescription('Edit your profile color')
            .addStringOption((option) =>
              option.setName('color').setDescription('The new color (example: #e75cc4)').setMinLength(7).setMaxLength(7).setRequired(false)
            )
        )
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('view')
        .setDescription('View a profile')
        .addUserOption((option) => option.setName('user').setDescription("The user of which you'd like to view the profile"))
        .addBooleanOption((option) => option.setName('ephemeral').setDescription('Whether the message should be ephemeral'))
    ),
  async execute({ client, interaction, lng }) {
    const { options } = interaction;

    if (options.getSubcommandGroup() === 'edit') {
      if (options.getSubcommand() === 'description') {
        const description = options.getString('description', false)?.replaceAll('\\n', '\n');

        if (!description) {
          await updateDescription(interaction.user.id, null);

          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(client.colors.economy).setDescription(t('profile.edit.description.removed', { lng }))],
            flags: [MessageFlags.Ephemeral]
          });
        }

        await updateDescription(interaction.user.id, description);

        // Check if description includes a link
        if (
          /(?:https?:\/\/|www\.)[\w-]+\.\w{2,}(\/\S*)?|\b[\w-]+\.(?:com|net|org|xyz|moe|edu|gov|info|io|tech|ai|biz|co|me|dev|tv|cc|app|uk|us|ca|eu|fr|de|jp|cn)\b/gm.test(
            description
          )
        ) {
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('profile.edit.description.link', { lng }))],
            flags: [MessageFlags.Ephemeral]
          });
        }

        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.economy).setDescription(t('profile.edit.description.set', { description }))],
          flags: [MessageFlags.Ephemeral]
        });
      } else if (options.getSubcommand() === 'color') {
        const color = options.getString('color', false);

        if (!color) {
          await updateColor(interaction.user.id, null);

          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(client.colors.economy).setDescription(t('profile.edit.color.removed', { lng }))],
            flags: [MessageFlags.Ephemeral]
          });
        }

        // Check if the color is a valid 7 character hex color
        if (!/^#([A-Fa-f0-9]{6})$/.test(color)) {
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('profile.edit.color.invalid', { lng }))],
            flags: [MessageFlags.Ephemeral]
          });
        }

        await updateColor(interaction.user.id, color);

        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.economy).setDescription(t('profile.edit.color.set', { lng }))],
          flags: [MessageFlags.Ephemeral]
        });
      }
    }

    if (options.getSubcommand() === 'view') {
      const user = options.getUser('user') || interaction.user;
      const ephemeral = options.getBoolean('ephemeral') ?? true;

      if (user.bot) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('profile.view.bot', { lng }))],
          flags: ephemeral ? [MessageFlags.Ephemeral] : undefined
        });
      }

      await interaction.deferReply({ flags: ephemeral ? [MessageFlags.Ephemeral] : undefined });

      const userData = (await getUser(user.id)) ?? {
        banned: false,
        description: undefined,
        color: undefined,
        marriedAt: undefined,
        marriedTo: undefined,
        wallet: 0,
        bank: 0,
        badges: [],
        inventory: [],
        language: supportedLanguages[0]
      };

      const embed = new EmbedBuilder()
        .setColor((userData.color as ColorResolvable | undefined) ?? client.colors.economy)
        .setTitle(user.displayName)
        .setThumbnail(user.displayAvatarURL());

      if (userData.banned) {
        embed.setDescription(t('profile.view.banned', { lng }));
      }

      if (userData.description?.length) {
        embed.addFields({ name: t('profile.view.description', { lng }), value: userData.description });
      }

      if (userData.badges?.length) {
        embed.addFields({
          name: t('profile.view.badges', { lng }),
          value: userData.badges
            .sort((a, b) => a.id - b.id)
            .map((badge) => `${getBadgeEmoji(badge.id, client)} ${BadgeType[badge.id]}`)
            .join('\n')
        });
      }

      if (userData.bank > 0 || userData.wallet > 0) {
        embed.addFields({
          name: t('profile.view.balance', { lng }),
          value: `${t('balance.bank', { lng })}: ${Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(userData.bank)} | ${t('balance.wallet', { lng })}: ${Intl.NumberFormat('en-US', { currency: 'USD', style: 'currency' }).format(userData.wallet)}`
        });
      }

      if (userData.marriedTo) {
        embed.addFields({
          name: t('profile.view.marriage', { lng }),
          value: `<@${userData.marriedTo}> ${time(Math.floor((userData.marriedAt ?? 0) / 1000), TimestampStyles.ShortDate)}`
        });
      }

      if (userData.language && userData.language !== supportedLanguages[0]) {
        embed.addFields({ name: t('profile.view.language', { lng }), value: userData.language });
      }

      if (!embed.data.fields?.length) {
        return interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('profile.view.empty', { lng }))] });
      }

      return interaction.editReply({ embeds: [embed] });
    }
  }
});

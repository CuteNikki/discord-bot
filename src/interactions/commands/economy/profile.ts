import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder, time, TimestampStyles } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { getUser, updateDescription } from 'db/user';

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
            .addStringOption((option) => option.setName('description').setDescription('The new description').setMinLength(1).setMaxLength(500))
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
        const description = options.getString('description', true);

        await updateDescription(interaction.user.id, description);

        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.economy).setDescription(t('profile.edit.description', { description }))],
          ephemeral: true
        });
      }
    }

    if (options.getSubcommand() === 'view') {
      const user = options.getUser('user') || interaction.user;
      const ephemeral = options.getBoolean('ephemeral') ?? true;

      if (user.bot) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('profile.view.bot', { lng }))],
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral });

      const userData = (await getUser(user.id)) ?? {
        banned: false,
        description: undefined,
        marriedAt: undefined,
        marriedTo: undefined,
        wallet: 0,
        bank: 0,
        badges: [],
        inventory: [],
        language: supportedLanguages[0]
      };

      const embed = new EmbedBuilder().setColor(client.colors.economy).setTitle(user.displayName).setThumbnail(user.displayAvatarURL());

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
            .join(' ')
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

      return interaction.editReply({ embeds: [embed] });
    }
  }
});

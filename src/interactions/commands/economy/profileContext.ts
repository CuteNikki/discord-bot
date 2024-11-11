import {
  ApplicationCommandType,
  ApplicationIntegrationType,
  ContextMenuCommandBuilder,
  EmbedBuilder,
  InteractionContextType,
  time,
  TimestampStyles
} from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { getUser } from 'db/user';

import { getBadgeEmoji } from 'utils/common';
import { supportedLanguages } from 'utils/language';

import { ModuleType } from 'types/interactions';
import { BadgeType } from 'types/user';

const commandType = ApplicationCommandType.User;

export default new Command<typeof commandType>({
  module: ModuleType.Utilities,
  data: new ContextMenuCommandBuilder()
    .setName('profile-context')
    // @ts-expect-error: This is an issue with DiscordJS typings version mismatch in v14.16.3
    .setType(commandType)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
  async execute({ interaction, client, lng }) {
    const { options } = interaction;

    const user = options.getUser('user') || interaction.user;

    if (user.bot) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('profile.view.bot', { lng }))], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

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
});

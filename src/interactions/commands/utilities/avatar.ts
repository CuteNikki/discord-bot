import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.Utilities,
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Get the avatar of a user')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .addUserOption((option) => option.setName('user').setDescription('User to get the avatar from').setRequired(false))
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to false will show the message to everyone').setRequired(false)),
  async execute({ interaction, client, lng }) {
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const { guild, user: author } = interaction;

    const user = await client.users
      .fetch(interaction.options.getUser('user', false) ?? author, { force: true })
      .catch((err) => logger.debug({ err }, 'Could not fetch user'));

    if (!user) {
      await interaction.editReply({ content: t('avatar.user', { lng }) });
      return;
    }

    const member = await guild?.members.fetch(user.id).catch((err) => logger.debug({ err, userId: user.id }, 'Could not fetch member'));

    const embeds: EmbedBuilder[] = [
      new EmbedBuilder()
        .setColor(client.colors.utilities)
        .setTitle(t('avatar.user_avatar', { lng }))
        .setImage(user.displayAvatarURL({ size: 4096 }))
    ];

    if (user.banner) {
      embeds.push(
        new EmbedBuilder()
          .setColor(client.colors.utilities)
          .setTitle(t('avatar.user_banner', { lng }))
          .setImage(user.bannerURL({ size: 4096 })!)
      );
    }

    if (member && member.avatar) {
      embeds.push(
        new EmbedBuilder()
          .setColor(client.colors.utilities)
          .setTitle(t('avatar.member_avatar', { lng }))
          .setImage(member.displayAvatarURL({ size: 4096 }))
      );
    }

    await interaction.editReply({ embeds });
  }
});

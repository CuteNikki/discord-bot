import { ApplicationCommandType, ApplicationIntegrationType, ContextMenuCommandBuilder, EmbedBuilder, InteractionContextType, MessageFlags } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { logger } from 'utils/logger';

import { ModuleType } from 'types/interactions';

export default new Command<ApplicationCommandType.User>({
  module: ModuleType.Utilities,
  data: new ContextMenuCommandBuilder()
    .setName('avatar-context')
    .setType(ApplicationCommandType.User)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
  async execute({ interaction, client, lng }) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    const { guild, user: author } = interaction;

    const user = await client.users
      .fetch(interaction.options.getUser('user', false) ?? author, { force: true })
      .catch((err) => logger.debug({ err }, 'Could not fetch user'));

    if (!user) {
      await interaction.editReply({ content: t('avatar.user', { lng }) });
      return;
    }

    const member = await guild?.members.fetch(user.id).catch((err) => logger.debug({ err, user }, 'Could not fetch member'));

    const embeds: EmbedBuilder[] = [
      new EmbedBuilder()
        .setColor(client.colors.utilities)
        .setTitle(t('avatar.user-avatar', { lng }))
        .setImage(user.displayAvatarURL({ size: 4096 }))
    ];

    if (user.banner) {
      embeds.push(
        new EmbedBuilder()
          .setColor(client.colors.utilities)
          .setTitle(t('avatar.user-banner', { lng }))
          .setImage(user.bannerURL({ size: 4096 })!)
      );
    }

    if (member && member.avatar) {
      embeds.push(
        new EmbedBuilder()
          .setColor(client.colors.utilities)
          .setTitle(t('avatar.member-avatar', { lng }))
          .setImage(member.displayAvatarURL({ size: 4096 }))
      );
    }

    await interaction.editReply({ embeds });
  }
});

import { ApplicationCommandType, ApplicationIntegrationType, ContextMenuCommandBuilder, EmbedBuilder, InteractionContextType } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { logger } from 'utils/logger';

export default new Command<ApplicationCommandType.User>({
  module: ModuleType.Utilities,
  data: new ContextMenuCommandBuilder()
    .setName('avatar-context')
    // @ts-expect-error: This is an issue with DiscordJS typings version mismatch in v14.16.3
    .setType(ApplicationCommandType.User)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
  async execute({ interaction, client, lng }) {
    await interaction.deferReply({ ephemeral: true });

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

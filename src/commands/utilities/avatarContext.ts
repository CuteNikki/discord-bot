import { ApplicationCommandType, ApplicationIntegrationType, Colors, ContextMenuCommandBuilder, EmbedBuilder, InteractionContextType } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { logger } from 'utils/logger';

export default new Command<ApplicationCommandType.User>({
  module: ModuleType.Utilities,
  botPermissions: ['SendMessages'],
  data: new ContextMenuCommandBuilder()
    .setName('Avatar & Banner')
    .setType(ApplicationCommandType.User)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),
  async execute({ interaction, client }) {
    const lng = await client.getUserLanguage(interaction.user.id);
    await interaction.deferReply({ ephemeral: true });

    const user = await client.users.fetch(interaction.targetId, { force: true }).catch((error) => logger.debug({ error }, 'Could not fetch user'));
    if (!user || !user.displayAvatarURL()) return interaction.editReply({ content: t('avatar.user', { lng }) });

    const member = await interaction.guild?.members.fetch(user.id).catch((error) => logger.debug({ error, userId: user.id }, 'Could not fetch member'));

    const embeds: EmbedBuilder[] = [
      new EmbedBuilder()
        .setColor(Colors.Aqua)
        .setTitle(t('avatar.user_avatar', { lng }))
        .setImage(user.displayAvatarURL({ size: 4096 })),
    ];
    if (user.banner)
      embeds.push(
        new EmbedBuilder()
          .setColor(Colors.Aqua)
          .setTitle(t('avatar.user_banner', { lng }))
          .setImage(user.bannerURL({ size: 4096 })!)
      );
    if (member && member.avatar)
      embeds.push(
        new EmbedBuilder()
          .setColor(Colors.Aqua)
          .setTitle(t('avatar.member_avatar', { lng }))
          .setImage(member.displayAvatarURL({ size: 4096 }))
      );

    interaction.editReply({ embeds });
  },
});

import { ApplicationCommandType, ApplicationIntegrationType, Colors, ContextMenuCommandBuilder, EmbedBuilder, InteractionContextType } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

export default new Command<ApplicationCommandType.User>({
  module: ModuleType.Utilities,
  data: new ContextMenuCommandBuilder()
    .setName('Avatar & Banner')
    .setType(ApplicationCommandType.User)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall),
  async execute({ interaction, client }) {
    const lng = await client.getUserLanguage(interaction.user.id);
    await interaction.deferReply({ ephemeral: true });

    try {
      const user = await client.users.fetch(interaction.targetId, { force: true });
      if (!user) return interaction.editReply({ content: t('avatar.user', { lng }) });

      const member = await interaction.guild?.members.fetch(user.id);

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
    } catch (err) {
      interaction.editReply({ content: t('avatar.failed', { lng }) });
    }
  },
});

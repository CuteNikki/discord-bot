import { ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

import { Command, Context, IntegrationTypes } from 'classes/command';

export default new Command({
  data: {
    name: 'Avatar/Banner',
    type: ApplicationCommandType.User,
    contexts: [Context.GUILD, Context.BOT_DM, Context.PRIVATE_CHANNEL],
    integration_types: [IntegrationTypes.GUILD_INSTALL, IntegrationTypes.USER_INSTALL],
  },
  async execute({ interaction, client }) {
    if (!interaction.isUserContextMenuCommand()) return;
    const lng = client.getLanguage(interaction.user.id);

    try {
      const user = await client.users.fetch(interaction.targetId, { force: true });
      if (!user) return interaction.reply({ content: i18next.t('avatar.user', { lng }) });

      const member = await interaction.guild?.members.fetch(user.id);

      const embeds: EmbedBuilder[] = [
        new EmbedBuilder()
          .setColor(Colors.Aqua)
          .setTitle(i18next.t('avatar.user_avatar', { lng }))
          .setImage(user.displayAvatarURL({ size: 4096 })),
      ];
      if (user.banner)
        embeds.push(
          new EmbedBuilder()
            .setColor(Colors.Aqua)
            .setTitle(i18next.t('avatar.user_banner', { lng }))
            .setImage(user.bannerURL({ size: 4096 })!)
        );
      if (member && member.avatar)
        embeds.push(
          new EmbedBuilder()
            .setColor(Colors.Aqua)
            .setTitle(i18next.t('avatar.member_avatar', { lng }))
            .setImage(member.displayAvatarURL({ size: 4096 }))
        );

      interaction.reply({ embeds });
    } catch (err) {
      interaction.reply({ content: i18next.t('avatar.failed', { lng }) });
    }
  },
});

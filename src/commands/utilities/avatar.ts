import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

export default new Command({
  module: ModuleType.Utilities,
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Get the avatar of a user')
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addUserOption((option) => option.setName('user').setDescription('User to get the avatar from').setRequired(false))
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to false will show the message to everyone').setRequired(false)),
  async execute({ interaction, client }) {
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });
    const lng = await client.getUserLanguage(interaction.user.id);

    try {
      const user = await client.users.fetch(interaction.options.getUser('user', false) ?? interaction.user, { force: true });
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

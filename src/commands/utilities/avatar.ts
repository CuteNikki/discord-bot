import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';
import i18next from 'i18next';

import { Command, Contexts, IntegrationTypes, ModuleType } from 'classes/command';

export default new Command({
  module: ModuleType.Utilities,
  data: {
    name: 'avatar',
    description: 'Get the avatar of a user',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.Guild, Contexts.BotDM, Contexts.PrivateChannel],
    integration_types: [IntegrationTypes.GuildInstall, IntegrationTypes.UserInstall],
    options: [
      {
        name: 'user',
        description: 'User to get the avatar from',
        type: ApplicationCommandOptionType.User,
      },
      {
        name: 'ephemeral',
        description: 'When set to false will show the message to everyone',
        type: ApplicationCommandOptionType.Boolean,
      },
    ],
  },
  async execute({ interaction, client }) {
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });
    const lng = await client.getUserLanguage(interaction.user.id);

    try {
      const user = await client.users.fetch(interaction.options.getUser('user', false) ?? interaction.user, { force: true });
      if (!user) return interaction.editReply({ content: i18next.t('avatar.user', { lng }) });

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

      interaction.editReply({ embeds });
    } catch (err) {
      interaction.editReply({ content: i18next.t('avatar.failed', { lng }) });
    }
  },
});

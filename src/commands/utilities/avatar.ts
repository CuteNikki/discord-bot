import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.Utilities,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Get the avatar of a user')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .addUserOption((option) => option.setName('user').setDescription('User to get the avatar from').setRequired(false))
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to false will show the message to everyone').setRequired(false)),
  async execute({ interaction, client }) {
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });
    const lng = await client.getUserLanguage(interaction.user.id);

    const user = await client.users
      .fetch(interaction.options.getUser('user', false) ?? interaction.user, { force: true })
      .catch((error) => logger.debug({ error }, 'Could not fetch user'));
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

    await interaction.editReply({ embeds });
  },
});

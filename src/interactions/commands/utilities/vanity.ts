import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.Utilities,
  data: new SlashCommandBuilder()
    .setName('vanity-check')
    .setDescription('Check to see if a vanity url is available')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .addStringOption((option) => option.setName('vanity').setDescription('The vanity to check').setRequired(true)),
  async execute({ interaction, client, lng }) {
    await interaction.deferReply({ ephemeral: true });

    const vanity = interaction.options.getString('vanity', true);
    const invite = await client.fetchInvite(vanity).catch((err) => logger.debug({ err, vanity }, 'Could not fetch invite'));

    if (!invite || !invite.guild || !invite.guild.vanityURLCode || invite.guild.vanityURLCode !== vanity) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('vanity.not-found', { lng }))] });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(client.colors.utilities)
      .setThumbnail(invite.guild.iconURL({ size: 2048, extension: 'webp' }))
      .setTitle(invite.guild.name)
      .addFields(
        { name: t('vanity.members', { lng }), value: invite.memberCount.toString() },
        {
          name: t('vanity.created-at', { lng }),
          value: `<t:${Math.floor(invite.guild.createdTimestamp / 1000)}:d> | <t:${Math.floor(invite.guild.createdTimestamp / 1000)}:R>`
        }
      );

    if (invite.guild.banner) {
      embed.addFields({ name: t('vanity.banner', { lng }), value: '** **' }).setImage(invite.guild.bannerURL({ size: 4096, extension: 'webp' }));
    }

    await interaction.editReply({
      content: `https://discord.gg/${invite.guild.vanityURLCode}`,
      embeds: [embed]
    });
  }
});

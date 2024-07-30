import { ApplicationIntegrationType, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.Utilities,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('vanity-check')
    .setDescription('Check to see if a vanity url is available')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .addStringOption((option) => option.setName('vanity').setDescription('The vanity to check').setRequired(true)),
  async execute({ interaction, client }) {
    await interaction.deferReply({ ephemeral: true });
    const lng = await client.getUserLanguage(interaction.user.id);

    const vanity = interaction.options.getString('vanity', true);
    const invite = await client.fetchInvite(vanity).catch((err) => logger.debug({ err, vanity }, 'Could not fetch invite'));

    if (!invite || !invite.guild || !invite.guild.vanityURLCode || invite.guild.vanityURLCode !== vanity) {
      return interaction.editReply({ content: t('vanity.not_found', { lng }) });
    } else {
      return interaction.editReply({
        content: t('vanity.found', {
          lng,
          guildName: invite.guild.name,
          guildMemberCount: invite.memberCount,
          vanity: `https://discord.gg/${invite.guild.vanityURLCode}`,
        }),
      });
    }
  },
});

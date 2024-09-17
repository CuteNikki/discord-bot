import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { getUserLanguage } from 'db/user';
import { getClientSettings } from 'db/client';

import { keys } from 'utils/keys';

export default new Command({
  module: ModuleType.General,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Gives you an invite link to the support server')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('Shows the message to everyone when false').setRequired(false)),
  async execute({ interaction }) {
    const lng = await getUserLanguage(interaction.user.id);
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const settings = await getClientSettings(keys.DISCORD_BOT_ID);

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(Colors.Blurple).setTitle(t('support.title', { lng })).setDescription(settings.support.inviteUrl)],
    });
  },
});

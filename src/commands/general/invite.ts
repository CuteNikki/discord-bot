import { ApplicationIntegrationType, Colors, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { keys } from 'utils/keys';

export default new Command({
  module: ModuleType.General,
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Gives you an invite link for the bot')
    .setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addBooleanOption((option) => option.setName('ephemeral').setDescription('When set to false will show the message to everyone').setRequired(false)),
  async execute({ interaction, client }) {
    const lng = await client.getUserLanguage(interaction.user.id);
    const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? true;
    await interaction.deferReply({ ephemeral });

    const settings = await client.getClientSettings(keys.DISCORD_BOT_ID);

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(Colors.Blurple).setTitle(t('invite.title', { lng })).setDescription(settings.inviteUrl)],
    });
  },
});

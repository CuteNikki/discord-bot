import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { divorceUsers, getUser } from 'db/user';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Economy,
  data: new SlashCommandBuilder()
    .setName('divorce')
    .setDescription('Divorce your partner')
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall),
  async execute({ client, interaction, lng }) {
    const userData = await getUser(interaction.user.id);

    if (!userData?.marriedTo) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('divorce.none', { lng }))], ephemeral: true });
    }

    await divorceUsers(interaction.user.id, userData.marriedTo);

    return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.economy).setDescription(t('divorce.success', { lng }))] });
  }
});

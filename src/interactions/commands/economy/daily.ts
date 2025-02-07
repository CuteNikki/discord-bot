import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder, time, TimestampStyles } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { claimDaily, getUser } from 'db/user';

import { ModuleType } from 'types/interactions';

export default new Command({
  module: ModuleType.Economy,
  cooldown: 0, // We have another cooldown for daily, which is stored in the database
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily reward')
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall),
  async execute({ client, interaction, lng }) {
    const { lastDaily } = await getUser(interaction.user.id, true);
    const cooldown = 1000 * 60 * 60 * 24;
    const now = Date.now();
    const timeLeft = (lastDaily ?? 0) + cooldown - now;

    if (timeLeft > 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.colors.error)
            .setDescription(t('daily.cooldown', { lng, left: time(Math.floor((now + timeLeft) / 1000), TimestampStyles.RelativeTime) }))
        ],
        flags: [MessageFlags.Ephemeral]
      });
    }

    await claimDaily(interaction.user.id, now);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.economy)
          .setDescription(t('daily.claimed', { lng, next: time(Math.floor((Date.now() + cooldown) / 1000), TimestampStyles.RelativeTime) }))
      ],
      flags: [MessageFlags.Ephemeral]
    });
  }
});

import {
  ApplicationIntegrationType,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import type { ExtendedClient } from 'classes/client';
import { Command } from 'classes/command';

import { deleteInfraction, getInfractionById, getInfractionsByUserIdAndGuildId } from 'database/infraction';

import { buildInfractionOverview } from 'utility/infraction';
import logger from 'utility/logger';

export default new Command({
  builder: new SlashCommandBuilder()
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setName('infractions')
    .setDescription('Manage infractions in the guild')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('history')
        .setDescription("View a user's infractions")
        .addUserOption((option) => option.setName('user').setDescription('The user to view infractions for').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('delete')
        .setDescription("Delete a user's infraction")
        .addUserOption((option) => option.setName('user').setDescription('The user to delete an infraction for').setRequired(true))
        .addStringOption((option) => option.setName('id').setDescription('The ID of the infraction to delete').setRequired(true)),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) {
      return await interaction.reply({
        content: 'This command can only be used in a server.',
        flags: [MessageFlags.Ephemeral],
      });
    }

    const client = interaction.client as ExtendedClient;

    switch (interaction.options.getSubcommand()) {
      case 'history':
        return await handleHistory(interaction);
      case 'delete':
        return await handleDelete(interaction);
      default:
        return await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Red)
              .setDescription('Invalid subcommand. Please use `/infractions history` or `/infractions delete`.'),
          ],
          flags: [MessageFlags.Ephemeral],
        });
    }

    /**
     * Handles the delete subcommand
     * @param interaction The interaction object
     */
    async function handleDelete(interaction: ChatInputCommandInteraction<'cached'>) {
      const targetUser = interaction.options.getUser('user', true);
      const infractionId = interaction.options.getString('id', true);

      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      const infraction = await getInfractionById(infractionId);

      if (!infraction || infraction.userId !== targetUser.id || infraction.guildId !== interaction.guild.id) {
        // If the infraction doesn't exist or doesn't belong to the user in the guild, return an error message
        logger.debug(
          { infractionId, targetUserId: targetUser.id, guildId: interaction.guild.id },
          'Infraction not found or does not belong to the user in the guild',
        );

        return await interaction.editReply({
          embeds: [
            new EmbedBuilder().setColor(Colors.Red).setDescription(`No infraction found with ID \`${infractionId}\` for ${targetUser}.`),
          ],
        });
      }

      // Delete the infraction from the database
      const deleted = await deleteInfraction(infractionId);

      logger.debug(
        { moderator: interaction.user.id, targetUserId: targetUser.id, infractionId, guildId: interaction.guild.id },
        deleted ? 'Infraction deleted' : 'Failed to delete infraction',
      );

      return await interaction.editReply({
        embeds: [
          deleted
            ? new EmbedBuilder()
                .setColor(Colors.Green)
                .setDescription(`Successfully deleted infraction \`${infractionId}\` for ${targetUser}.`)
            : new EmbedBuilder().setColor(Colors.Red).setDescription(`Failed to delete infraction \`${infractionId}\` for ${targetUser}.`),
        ],
      });
    }

    /**
     * Handles the history subcommand
     * @param interaction The interaction object
     */
    async function handleHistory(interaction: ChatInputCommandInteraction<'cached'>) {
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      const targetUser = interaction.options.getUser('user', true);

      if (targetUser.bot) {
        return await interaction.editReply({
          embeds: [
            new EmbedBuilder().setColor(Colors.Red).setDescription(`You cannot view infractions for bots because they are not tracked.`),
          ],
        });
      }

      const infractions = await getInfractionsByUserIdAndGuildId(targetUser.id, interaction.guild.id);
      const itemsPerPage = 3;

      return interaction.editReply(
        buildInfractionOverview({
          client,
          infractions,
          targetUser,
          itemsPerPage,
          page: 0,
        }),
      );
    }
  },
});

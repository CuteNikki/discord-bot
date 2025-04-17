import {
  ApplicationIntegrationType,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  userMention,
} from 'discord.js';

import type { ExtendedClient } from 'classes/client';
import { Command } from 'classes/command';

import { deleteInfraction, getInfractionById, getInfractionsByGuildId, getInfractionsByUserIdAndGuildId } from 'database/infraction';

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
        .addStringOption((option) =>
          option.setName('id').setDescription('The ID of the infraction to delete').setAutocomplete(true).setRequired(true),
        ),
    ),
  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();

    if (focused.name === 'id' && interaction.inCachedGuild()) {
      const guildId = interaction.guild.id;

      const infractions = await getInfractionsByGuildId(guildId).catch((err) =>
        logger.error({ err, guildId }, 'Failed to get infractions'),
      );

      if (!infractions || infractions.length === 0) {
        return await interaction.respond([]);
      }

      const choices = infractions.map((infraction) => ({
        name: infraction.id,
        value: infraction.id,
      }));

      return await interaction.respond(choices.slice(0, 25));
    }
  },
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
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      const infractionId = interaction.options.getString('id', true);

      const infraction = await getInfractionById(infractionId);

      if (!infraction || infraction.guildId !== interaction.guild.id) {
        // If the infraction doesn't exist or doesn't belong to the user in the guild, return an error message
        logger.debug({ infractionId, guildId: interaction.guild.id }, 'Infraction not found or does not belong to the guild');

        return await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`No infraction found with ID \`${infractionId}\`.`)],
        });
      }

      // Delete the infraction from the database
      const isDeleted = await deleteInfraction(infractionId).catch((err) =>
        logger.error({ err, infractionId }, 'Failed to delete infraction'),
      );

      return await interaction.editReply({
        embeds: [
          isDeleted
            ? new EmbedBuilder()
                .setColor(Colors.Green)
                .setDescription(`Successfully deleted infraction \`${infractionId}\` of ${userMention(isDeleted.userId)}.`)
            : new EmbedBuilder().setColor(Colors.Red).setDescription(`Failed to delete infraction \`${infractionId}\`.`),
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

      const infractions = await getInfractionsByUserIdAndGuildId(targetUser.id, interaction.guild.id).catch((err) =>
        logger.error({ err, targetUser: targetUser.id, guild: interaction.guild.id }, 'Failed to get infractions'),
      );
      if (!infractions || infractions.length === 0) {
        return await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`No infractions found for ${targetUser}.`)],
        });
      }

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

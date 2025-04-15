import { InfractionType } from '@prisma/client';
import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  time,
  TimestampStyles,
} from 'discord.js';

import type { ExtendedClient } from 'classes/client';
import { Command } from 'classes/command';

import { deleteInfraction, getInfractionById, getInfractionsByUserIdAndGuildId } from 'database/infraction';

import logger from 'utility/logger';

export default new Command({
  builder: new SlashCommandBuilder()
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setName('punishments')
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

      const staffEmoji = client.customEmojis.staff;
      const dateEmoji = client.customEmojis.date;
      const calendarEmoji = client.customEmojis.calendar;
      const receiptEmoji = client.customEmojis.receipt;
      const pencilEmoji = client.customEmojis.pencil;
      const infinityEmoji = client.customEmojis.infinity;
      const banEmoji = client.customEmojis.ban;
      const hammerEmoji = client.customEmojis.hammer;
      const exclamationEmoji = client.customEmojis.exclamation;
      const clockEmoji = client.customEmojis.clock;
      const backwardsEmoji = client.customEmojis.backwards;
      const forwardsEmoji = client.customEmojis.forwards;
      const nextEmoji = client.customEmojis.forwardstep;
      const previousEmoji = client.customEmojis.backwardstep;

      const ITEMS_PER_PAGE = 3;
      const pageIndex = 0;

      const totalInfractions = await getInfractionsByUserIdAndGuildId(targetUser.id, interaction.guild.id);

      const pageInfractions = totalInfractions.slice(0, ITEMS_PER_PAGE);
      // const pageInfractions = await getInfractionsByUserIdAndGuildIdPaginated(
      //   targetUser.id,
      //   interaction.guild.id,
      //   pageIndex * ITEMS_PER_PAGE,
      //   ITEMS_PER_PAGE,
      // );

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.White)
            .setAuthor({ name: `${targetUser.displayName} - Overview`, iconURL: targetUser.displayAvatarURL() })
            .setDescription(
              [
                `${infinityEmoji} Total: ${totalInfractions.length}`,
                `${banEmoji} Bans: ${totalInfractions.filter((infraction) => infraction.type === InfractionType.Ban).length}`,
                `${calendarEmoji} Tempbans: ${totalInfractions.filter((infraction) => infraction.type === InfractionType.Tempban).length}`,
                `${hammerEmoji} Kicks: ${totalInfractions.filter((infraction) => infraction.type === InfractionType.Kick).length}`,
                `${exclamationEmoji} Warns: ${totalInfractions.filter((infraction) => infraction.type === InfractionType.Warn).length}`,
                `${clockEmoji} Timeouts: ${totalInfractions.filter((infraction) => infraction.type === InfractionType.Timeout).length}`,
              ].join('\n'),
            ),
          // Map through the infractions and create an embed for each
          ...pageInfractions.map((infraction) =>
            infraction.expiresAt
              ? new EmbedBuilder()
                  .setColor(Colors.White)
                  .setDescription(
                    [
                      `**${infraction.id}**`,
                      `${receiptEmoji} Type: ${infraction.type}`,
                      `${pencilEmoji} Reason: ${infraction.reason}`,
                      `${staffEmoji} Moderator: <@${infraction.moderatorId}>`,
                      `${calendarEmoji} ${infraction.isActive ? 'Expires' : 'Expired'}: ${time(Math.floor(infraction.expiresAt.getTime() / 1_000), TimestampStyles.ShortDateTime)}`,
                      `${dateEmoji} Date: ${time(Math.floor(infraction.createdAt.getTime() / 1_000), TimestampStyles.ShortDateTime)}`,
                    ].join('\n'),
                  )
              : new EmbedBuilder()
                  .setColor(Colors.White)
                  .setDescription(
                    [
                      `**${infraction.id}**`,
                      `${receiptEmoji} Type: ${infraction.type}`,
                      `${pencilEmoji} Reason: ${infraction.reason}`,
                      `${staffEmoji} Moderator: <@${infraction.moderatorId}>`,
                      `${dateEmoji} Date: ${time(Math.floor(infraction.createdAt.getTime() / 1_000), TimestampStyles.ShortDateTime)}`,
                    ].join('\n'),
                  ),
          ),
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`infractions-first_${targetUser.id}`) // No need to pass the page index to the first button
              .setEmoji({ id: backwardsEmoji.id })
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true), // Disable if on the first page
            new ButtonBuilder()
              .setCustomId(`infractions-previous_${pageIndex}_${targetUser.id}`) // Pass the page index to the previous button
              .setEmoji({ id: previousEmoji.id })
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(true), // Disable if on the first page
            new ButtonBuilder()
              .setCustomId(`infractions-custom_${targetUser.id}`)
              .setLabel(`${pageIndex + 1} / ${Math.ceil(totalInfractions.length / ITEMS_PER_PAGE)}`)
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(totalInfractions.length <= ITEMS_PER_PAGE),
            new ButtonBuilder()
              .setCustomId(`infractions-next_${pageIndex}_${targetUser.id}`) // Pass the page index to the next button
              .setEmoji({ id: nextEmoji.id })
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(totalInfractions.length <= ITEMS_PER_PAGE), // Disable if on the last page
            new ButtonBuilder()
              .setCustomId(`infractions-last_${targetUser.id}`) // No need to pass the page index to the last button
              .setEmoji({ id: forwardsEmoji.id })
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(totalInfractions.length <= ITEMS_PER_PAGE), // Disable if on the last page
          ),
        ],
      });
    }
  },
});

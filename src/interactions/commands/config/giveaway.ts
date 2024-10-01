import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder
} from 'discord.js';
import ms from 'ms';

import { Command, ModuleType } from 'classes/command';

import { createGiveaway, deleteGiveaway, findGiveawayById, getGiveaways, getWinners, updateGiveaway } from 'db/giveaway';

import { logger } from 'utils/logger';

const MAX_GIVEAWAYS = 6;

export default new Command({
  module: ModuleType.Config,
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Create and manage giveaways for your members')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall)
    .addSubcommand((cmd) =>
      cmd
        .setName('create')
        .setDescription('Create a giveaway')
        .addStringOption((option) => option.setName('prize').setDescription('The prize that the winner obtains').setRequired(true))
        .addStringOption((option) => option.setName('duration').setDescription('The duration of the giveaway').setRequired(true))
        .addIntegerOption((option) => option.setName('winners').setDescription('The number of winners (default: 1)').setRequired(false))
        .addChannelOption((option) =>
          option.setName('channel').setDescription('The channel to send the giveaway to').setRequired(false).addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('edit')
        .setDescription('Edit a giveaway')
        .addStringOption((option) => option.setName('id').setDescription('The ID of the giveaway').setRequired(true))
        .addStringOption((option) => option.setName('prize').setDescription('The prize that the winner obtains').setRequired(false))
        .addStringOption((option) => option.setName('duration').setDescription('The duration of the giveaway').setRequired(false))
        .addIntegerOption((option) => option.setName('winners').setDescription('The number of winners').setRequired(false).setMinValue(1).setMaxValue(50))
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('reroll')
        .setDescription('Get another winner for a giveaway')
        .addStringOption((option) => option.setName('id').setDescription('The ID of the giveaway').setRequired(true))
        .addIntegerOption((option) => option.setName('winners').setDescription('The number of new winners').setRequired(false).setMinValue(1).setMaxValue(50))
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('delete')
        .setDescription('Delete a giveaway')
        .addStringOption((option) => option.setName('id').setDescription('The ID of the giveaway').setRequired(true))
    )
    .addSubcommand((cmd) =>
      cmd
        .setName('end')
        .setDescription('End a giveaway')
        .addStringOption((option) => option.setName('id').setDescription('The ID of the giveaway').setRequired(true))
    )
    .addSubcommand((cmd) => cmd.setName('list').setDescription('List all active giveaways')),
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild() || !interaction.channel?.isSendable()) return;

    await interaction.deferReply();

    const { options, guildId } = interaction;

    // Needed for create and list
    const giveaways = await getGiveaways(guildId);

    switch (options.getSubcommand()) {
      case 'create':
        {
          const prize = options.getString('prize', true);
          const duration = options.getString('duration', true);
          const winners = options.getInteger('winners', false) ?? 1;
          const channel = options.getChannel('channel', false, [ChannelType.GuildText]) ?? interaction.channel;
          const NOW = Date.now();

          const parsedDuration = ms(duration);

          if (!parsedDuration) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('Invalid duration')]
            });
            return;
          }

          if (giveaways.length >= MAX_GIVEAWAYS) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('Maximum giveaways reached!')] });
            return;
          }

          const msg = await channel
            .send({
              embeds: [
                new EmbedBuilder()
                  .setColor(client.colors.giveaway)
                  .setTitle('Giveaway')
                  .addFields(
                    { name: 'Prize', value: prize },
                    { name: 'Winners', value: winners.toString() },
                    { name: 'Ends at', value: `<t:${Math.floor((NOW + parsedDuration) / 1000)}:f> (<t:${Math.floor((NOW + parsedDuration) / 1000)}:R>)` }
                  )
              ],
              components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  new ButtonBuilder().setCustomId('button-giveaway-join').setLabel('Join').setEmoji('🎉').setStyle(ButtonStyle.Primary)
                )
              ]
            })
            .catch((err) => logger.debug(err, 'Could not send message'));
          if (!msg) {
            return;
          }

          const giveaway = await createGiveaway(guildId, channel.id, msg.id, prize, parsedDuration, winners, NOW + parsedDuration, NOW);
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.giveaway)
                .setDescription(
                  [
                    `Giveaway created in ${channel.toString()}.`,
                    `ID: ${giveaway._id.toString()}`,
                    `Ends in ${ms(parsedDuration, { long: true })}`,
                    `Prize is ${prize}`,
                    `There will be ${winners} winner(s)!`
                  ].join('\n')
                )
            ]
          });
        }
        break;
      case 'edit':
        {
          const id = options.getString('id', true);
          const prize = options.getString('prize', false);
          const duration = options.getString('duration', false);
          const winners = options.getInteger('winners', false);

          const giveaway = await findGiveawayById(id);

          if (!giveaway) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('No giveaway found')] });
            return;
          }

          if (!prize && !duration && !winners) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('No changes provided')] });
            return;
          }

          const response: string[] = [];

          if (prize) {
            await updateGiveaway(id, { $set: { prize } });
            response.push(`Prize changed to ${prize}`);
          }

          if (duration) {
            const parsedDuration = ms(duration);

            if (!parsedDuration) {
              await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('Invalid duration')] });
              return;
            }

            await updateGiveaway(id, { $set: { duration: ms(duration), endsAt: giveaway.createdAt + parsedDuration } });
            response.push(`Duration updated! Giveaway will end in ${ms(giveaway.createdAt + parsedDuration - Date.now(), { long: true })}`);
          }

          if (winners) {
            await updateGiveaway(id, { $set: { winnerCount: winners } });
            response.push(`Winner count updated to ${winners}`);
          }

          if (!response.length) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('No changes provided')] });
            return;
          }

          await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.giveaway).setDescription(response.join('\n'))] });
        }
        break;
      case 'reroll':
        {
          const id = options.getString('id', true);
          const winnerCount = options.getInteger('winners', false) ?? 1;

          const giveaway = await findGiveawayById(id);

          if (!giveaway) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('No giveaway found')] });
            return;
          }

          if (giveaway.endsAt > Date.now()) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('Giveaway is still active')] });
            return;
          }

          if (giveaway.participants.length < winnerCount) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('Not enough participants!')] });
            return;
          }

          const winners = getWinners(giveaway.participants, giveaway.winnerIds, winnerCount);

          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.giveaway).setDescription(`The new winner(s) are: ${winners.join(', ')}`)]
          });
        }
        break;
      case 'end':
        {
          const id = options.getString('id', true);

          const giveaway = await findGiveawayById(id);

          if (!giveaway) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('No giveaway found')] });
            return;
          }

          if (giveaway.endsAt < Date.now()) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('Giveaway is already ended')] });
            return;
          }

          await updateGiveaway(id, { $set: { endsAt: Date.now() } });

          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.giveaway)
                .setDescription('Giveaway ended! Please allow up to 10 seconds for the winners to be determined.')
            ]
          });
        }
        break;
      case 'delete':
        {
          const id = options.getString('id', true);

          const giveaway = await findGiveawayById(id);

          if (!giveaway) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('No giveaway found')] });
            return;
          }

          await deleteGiveaway(id);

          await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.giveaway).setDescription('Giveaway deleted!')] });
        }
        break;
      case 'list':
        {
          if (!giveaways.length) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('No giveaways found!')] });
            return;
          }

          await interaction.editReply({
            embeds: [
              new EmbedBuilder().setColor(client.colors.giveaway).addFields(
                giveaways.map((giveaway) => ({
                  name: giveaway._id.toString(),
                  value: [
                    `Prize: ${giveaway.prize}`,
                    `Winner count: ${giveaway.winnerCount}`,
                    `Participants: ${giveaway.participants.length}`,
                    `Duration: ${ms(giveaway.duration, { long: true })}`,
                    `Ends at: <t:${Math.floor(giveaway.endsAt / 1000)}:f>`,
                    `Created at <t:${Math.floor(giveaway.createdAt / 1000)}:f>`
                  ].join('\n')
                }))
              )
            ]
          });
        }
        break;
    }
  }
});

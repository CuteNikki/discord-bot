import {
  ActionRowBuilder,
  ApplicationIntegrationType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  time,
  TimestampStyles
} from 'discord.js';
import { t } from 'i18next';
import ms from 'ms';

import { Command, ModuleType } from 'classes/command';

import { createGiveaway, deleteGiveaway, findGiveawayById, getGiveaways, getWinners, updateGiveaway } from 'db/giveaway';
import { getGuildLanguage } from 'db/language';

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
  async execute({ interaction, client, lng }) {
    if (!interaction.inCachedGuild() || !interaction.channel?.isSendable()) return;

    await interaction.deferReply();

    const { options, guildId } = interaction;

    // Needed for create and list
    const giveaways = await getGiveaways(guildId);

    const guildLng = await getGuildLanguage(guildId);

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
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.create.invalid-duration', { lng }))]
            });
            return;
          }

          if (giveaways.length >= MAX_GIVEAWAYS) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.create.max-giveaways', { lng }))]
            });
            return;
          }

          const msg = await channel
            .send({
              embeds: [
                new EmbedBuilder()
                  .setColor(client.colors.giveaway)
                  .setTitle(t('giveaway.message.title', { lng: guildLng }))
                  .addFields(
                    { name: t('giveaway.message.prize', { lng: guildLng }), value: prize },
                    { name: t('giveaway.message.winner', { lng: guildLng, count: winners }), value: winners.toString() },
                    {
                      name: t('giveaway.message.ends-at', { lng: guildLng }),
                      value: `${time(Math.floor((NOW + parsedDuration) / 1000), TimestampStyles.ShortDateTime)} (${time(Math.floor((NOW + parsedDuration) / 1000), TimestampStyles.RelativeTime)})`
                    }
                  )
              ],
              components: [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  new ButtonBuilder()
                    .setCustomId('button-giveaway-join')
                    .setLabel(t('giveaway.join.label', { lng: guildLng }))
                    .setEmoji('🎉')
                    .setStyle(ButtonStyle.Primary)
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
                .setTitle(t('giveaway.create.title', { lng }))
                .setDescription(
                  [
                    t('giveaway.info.id', { lng, id: giveaway._id.toString() }),
                    t('giveaway.info.channel', { lng, channel: channel.toString() }),
                    t('giveaway.info.prize', { lng, prize }),
                    t('giveaway.info.winner', { lng, winners: winners.toString(), count: winners }),
                    t('giveaway.info.duration', { lng, duration: ms(parsedDuration, { long: true }) }),
                    t('giveaway.info.ends-at', {
                      lng,
                      endsAt:
                        time(Math.floor(giveaway.endsAt / 1000), TimestampStyles.ShortDateTime) +
                        ` (${time(Math.floor(giveaway.endsAt / 1000), TimestampStyles.RelativeTime)})`
                    })
                  ].join('\n')
                )
            ]
          });
        }
        break;
      case 'edit':
        {
          const id = options.getString('id', true);

          const giveaway = await findGiveawayById(id);

          if (!giveaway) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.common.invalid-giveaway', { lng }))]
            });
            return;
          }

          const prize = options.getString('prize', false);
          const duration = options.getString('duration', false);
          const winners = options.getInteger('winners', false);

          if (!prize && !duration && !winners) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.edit.none', { lng }))] });
            return;
          }

          const response: string[] = [];

          if (prize) {
            response.push(t('giveaway.edit.prize', { lng, prize, count: winners ?? giveaway.winnerCount }));
          }

          if (duration) {
            response.push(t('giveaway.edit.duration', { lng, duration: ms(giveaway.createdAt + ms(duration) - Date.now(), { long: true }) }));
          }

          if (winners) {
            response.push(t('giveaway.edit.winner', { lng, winners: winners.toString(), count: winners }));
          }

          if (!response.length) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.edit.none', { lng }))] });
            return;
          }

          const updatedGiveaway = await updateGiveaway(id, {
            $set: {
              winnerCount: winners ?? giveaway.winnerCount,
              endsAt: duration ? giveaway.createdAt + ms(duration) : giveaway.endsAt,
              duration: duration ?? giveaway.duration,
              prize: prize ?? giveaway.prize
            }
          });

          await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.giveaway).setDescription(response.join('\n'))] });

          const channel = await interaction.guild.channels.fetch(giveaway.channelId).catch((err) => logger.debug({ err }, 'Could not fetch channel'));

          if (!channel?.isSendable()) {
            return;
          }

          const msg = await channel.messages.fetch(giveaway.messageId).catch((err) => logger.debug({ err }, 'Could not fetch message'));

          if (!msg) {
            return;
          }

          await msg
            .edit({
              embeds: [
                new EmbedBuilder()
                  .setColor(client.colors.giveaway)
                  .setTitle(t('giveaway.message.title', { lng: guildLng }))
                  .addFields(
                    { name: t('giveaway.message.prize', { lng: guildLng }), value: updatedGiveaway.prize },
                    {
                      name: t('giveaway.message.winner', { lng: guildLng, count: updatedGiveaway.winnerCount }),
                      value: updatedGiveaway.winnerCount.toString()
                    },
                    {
                      name: t('giveaway.message.ends-at', { lng: guildLng }),
                      value:
                        time(Math.floor(updatedGiveaway.endsAt / 1000), TimestampStyles.ShortDateTime) +
                        ` (${time(Math.floor(updatedGiveaway.endsAt / 1000), TimestampStyles.RelativeTime)})`
                    },
                    {
                      name: t('giveaway.message.participant', { lng: guildLng, count: updatedGiveaway.participants.length }),
                      value: updatedGiveaway.participants.length.toString()
                    }
                  )
              ]
            })
            .catch((err) => logger.debug({ err, giveaway }, 'Could not edit giveaway message'));
        }
        break;
      case 'reroll':
        {
          const id = options.getString('id', true);
          const winnerCount = options.getInteger('winners', false) ?? 1;

          const giveaway = await findGiveawayById(id);

          if (!giveaway) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.common.invalid-giveaway', { lng }))]
            });
            return;
          }

          if (giveaway.endsAt > Date.now()) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.common.active', { lng }))] });
            return;
          }

          if (giveaway.participants.length < winnerCount) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.reroll.no-participants', { lng }))]
            });
            return;
          }

          const winners = getWinners(giveaway.participants, giveaway.winnerIds, winnerCount);

          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.giveaway)
                .setDescription(t('giveaway.reroll.success', { lng, winners: winners.join(', '), count: winners.length }))
            ]
          });
        }
        break;
      case 'end':
        {
          const id = options.getString('id', true);

          const giveaway = await findGiveawayById(id);

          if (!giveaway) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.common.invalid-giveaway', { lng }))]
            });
            return;
          }

          if (giveaway.endsAt < Date.now()) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.common.inactive', { lng }))] });
            return;
          }

          await updateGiveaway(id, { $set: { endsAt: Date.now() } });

          await interaction.editReply({
            embeds: [new EmbedBuilder().setColor(client.colors.giveaway).setDescription(t('giveaway.end.success', { lng }))]
          });
        }
        break;
      case 'delete':
        {
          const id = options.getString('id', true);

          const giveaway = await findGiveawayById(id);

          if (!giveaway) {
            await interaction.editReply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.common.invalid-giveaway', { lng }))]
            });
            return;
          }

          await deleteGiveaway(id);

          await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.giveaway).setDescription(t('giveaway.delete.success', { lng }))] });

          const channel = await interaction.guild.channels.fetch(giveaway.channelId).catch((err) => logger.debug({ err }, 'Could not fetch channel'));

          if (!channel?.isSendable()) {
            return;
          }

          const msg = await channel.messages.fetch(giveaway.messageId).catch((err) => logger.debug({ err }, 'Could not fetch message'));

          if (!msg) {
            return;
          }

          await msg.delete().catch((err) => logger.debug({ err, giveaway }, 'Could not delete message'));
        }
        break;
      case 'list':
        {
          if (!giveaways.length) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('giveaway.list.none', { lng }))] });
            return;
          }

          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.colors.giveaway)
                .setTitle(t('giveaway.list.title', { lng }))
                .addFields(
                  giveaways.map((giveaway) => ({
                    name: giveaway._id.toString(),
                    value: [
                      t('giveaway.info.prize', { lng, prize: giveaway.prize }),
                      t('giveaway.info.winner', { lng, winners: giveaway.winnerCount.toString(), count: giveaway.winnerCount }),
                      t('giveaway.info.participant', { lng, participants: giveaway.participants.length.toString(), count: giveaway.participants.length }),
                      t('giveaway.info.duration', { lng, duration: ms(giveaway.duration, { long: true }) }),
                      t('giveaway.info.ends-at', { lng, endsAt: time(Math.floor(giveaway.endsAt / 1000), TimestampStyles.ShortDateTime) }),
                      t('giveaway.info.created-at', { lng, createdAt: time(Math.floor(giveaway.createdAt / 1000), TimestampStyles.ShortDateTime) })
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

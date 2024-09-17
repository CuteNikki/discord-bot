import { ApplicationIntegrationType, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { availableChannelModel, connectionModel } from 'models/phone';

import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.Fun,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('phone')
    .setDescription('Start a phone call with a random person')
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .addSubcommand((subcommand) => subcommand.setName('connect').setDescription('Connects you to another random caller'))
    .addSubcommand((subcommand) => subcommand.setName('hangup').setDescription('Disconnects you from the call')),
  async execute({ client, interaction }) {
    await interaction.deferReply();

    const { user, options, channelId } = interaction;
    const lng = await client.getUserLanguage(user.id);

    switch (options.getSubcommand()) {
      case 'connect':
        {
          // Check if this channel is already in a connection
          const existingConnection = await connectionModel
            .findOne({
              $or: [{ channelIdOne: channelId }, { channelIdTwo: channelId }],
            })
            .lean()
            .exec();
          if (existingConnection) return interaction.editReply(t('phone.connect.already', { lng }));
          // Check if this channel is already searching for a connection
          const availableChannel = await availableChannelModel.findOne({ channelId }).lean().exec();
          if (availableChannel) return interaction.editReply(t('phone.connect.already', { lng }));

          // Check for available channels
          const availablePhones = await availableChannelModel
            .find({ channelId: { $ne: channelId }, userId: { $ne: user.id } })
            .lean()
            .exec();

          if (availablePhones.length > 0) {
            // Get random available phone call
            const randomIndex = Math.floor(Math.random() * availablePhones.length);
            const randomTarget = availablePhones[randomIndex];

            // Remove target channel from pool
            await availableChannelModel.deleteOne({ channelId: randomTarget.channelId }).lean().exec();
            // Save the connection
            await connectionModel.create({
              channelIdOne: channelId,
              userIdOne: user.id,
              channelIdTwo: randomTarget.channelId,
              userIdTwo: randomTarget.userId,
            });

            // Inform channel
            interaction.editReply(t('phone.connect.connected', { lng }));

            // Inform target channel
            const targetChannel = await client.channels
              .fetch(randomTarget.channelId)
              .catch((err) => logger.debug({ err, targetChannelId: randomTarget.channelId }, 'Could not fetch target channel'));
            if (!targetChannel || !targetChannel.isSendable()) return;
            targetChannel.send(t('phone.connect.connected'));
          } else {
            // No available channels, add this channel to the pool
            await availableChannelModel.create({ channelId, userId: user.id });
            interaction.editReply(t('phone.connect.waiting', { lng }));
          }
        }
        break;
      case 'hangup':
        {
          const availableChannel = await availableChannelModel.findOne({ channelId }).lean().exec();
          if (availableChannel) {
            await availableChannelModel.findByIdAndDelete(availableChannel._id);
            return interaction.editReply(t('phone.hangup.disconnecting', { lng }));
          }

          const existingConnection = await connectionModel
            .findOne({
              $or: [{ channelIdOne: channelId }, { channelIdTwo: channelId }],
            })
            .lean()
            .exec();
          if (!existingConnection) return interaction.editReply(t('phone.hangup.none', { lng }));

          const otherLng = await client.getUserLanguage(existingConnection.userIdOne === user.id ? existingConnection.userIdTwo : existingConnection.userIdOne);

          // Find the connected channel ID
          const connectedChannelId = existingConnection.channelIdOne === channelId ? existingConnection.channelIdTwo : existingConnection.channelIdOne;

          // Remove the connection
          await connectionModel.deleteOne({ _id: existingConnection._id });

          // Inform channel
          interaction.editReply(t('phone.hangup.disconnecting', { lng }));

          // Inform the other channel
          const targetChannel = await client.channels
            .fetch(connectedChannelId)
            .catch((err) => logger.debug({ err, targetChannelId: connectedChannelId }, 'Could not fetch target channel'));
          if (!targetChannel || !targetChannel.isSendable()) return;
          targetChannel.send(t('phone.hangup.disconnected', { lng: otherLng }));
        }
        break;
    }
  },
});

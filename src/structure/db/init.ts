import { CronJob } from 'cron';
import { Colors, EmbedBuilder } from 'discord.js';
import { t } from 'i18next';
import { connect } from 'mongoose';
import { performance } from 'perf_hooks';

import { DiscordClient } from 'classes/client';

import { getClientSettings, updateLastWeeklyClearAt } from 'db/client';
import { deleteCustomVoiceChannel, getCustomVoiceChannels } from 'db/custom-voice';
import { closeInfraction, getUnresolvedInfractions } from 'db/infraction';
import { deleteExpiredReminders, getExpiredReminders } from 'db/reminder';
import { getUserLanguage } from 'db/user';

import { weeklyLevelModel } from 'models/weeklyLevel';

import { InfractionType } from 'types/infraction';

import { keys } from 'constants/keys';

import { sendError } from 'utils/error';
import { logger } from 'utils/logger';

export async function initDatabase(client: DiscordClient) {
  const startTime = performance.now();
  await connect(keys.DATABASE_URI)
    .then(() => {
      const endTime = performance.now();
      logger.info(`[${client.cluster.id}] Connected to database in ${Math.floor(endTime - startTime)}ms`);

      client.once('ready', () => {
        CronJob.from({
          cronTime: '*/20 * * * * *', // every 20 seconds
          onTick: () => {
            clearExpiredInfractions(client); // Handle expired infractions
            clearWeekly(client); // Handle weekly clear
            clearReminders(client); // Handle reminders
            clearCustomVoiceChannels(client); // Clear all custom voice channels made before start/restart
          },
          runOnInit: true,
          start: true,
        });
      });
    })
    .catch((err) => sendError({ client, err, location: 'Mongoose Connection Error' }));
}

async function clearCustomVoiceChannels(client: DiscordClient) {
  const customVoiceChannels = await getCustomVoiceChannels();
  logger.debug(`[${client.cluster.id}] Found ${customVoiceChannels.length} custom voice channels`);

  // Iterate through each custom voice channel in the database
  for (const customVoiceChannel of customVoiceChannels) {
    // Fetch the channel to check if it still exists
    const channel = await client.channels
      .fetch(customVoiceChannel.channelId)
      .catch((err) => logger.debug({ err, customVoiceChannel }, 'Could not fetch channel'));

    logger.debug(`[${client.cluster.id}] ${channel ? 'Checking' : 'Deleting'} custom voice channel: ${customVoiceChannel.channelId}`);

    // If we can't find the channel, delete it from the database
    if (!channel) {
      return await deleteCustomVoiceChannel(customVoiceChannel.channelId);
    }

    // If the channel is empty, delete it
    if (channel.isVoiceBased() && !channel.members.size) {
      await deleteCustomVoiceChannel(customVoiceChannel.channelId);
      return await channel.delete().catch((err) => logger.debug({ err, customVoiceChannel }, 'Could not delete custom voice channel'));
    }
  }
}

async function clearWeekly(client: DiscordClient) {
  const WEEK = 604800000;
  const NOW = Date.now();

  const { database } = await getClientSettings(keys.DISCORD_BOT_ID);

  // If now is bigger than last weekly clear plus a week
  if (NOW > database.lastWeeklyClearAt + WEEK) {
    // Clear weekly level
    clearWeeklyLevel(client, keys.DISCORD_BOT_ID);
  }
}

async function clearWeeklyLevel(client: DiscordClient, applicationId: string) {
  // Clear weekly level model and collection
  const clearedLevel = await weeklyLevelModel.deleteMany({});

  // Notify that weekly level have been cleared
  logger.debug(`[${client.cluster.id}] Cleared ${clearedLevel.deletedCount} weekly level`);

  // Update last weekly level clear with current date
  await updateLastWeeklyClearAt(applicationId, Date.now());
}

async function clearReminders(client: DiscordClient) {
  // Store current time to avoid deleting newly expired reminders later
  const NOW = Date.now();
  // Fetch all due reminders
  const dueReminders = await getExpiredReminders(NOW);

  for (const reminder of dueReminders) {
    const lng = await getUserLanguage(reminder.userId);
    const embed = new EmbedBuilder()
      .setColor(Colors.Aqua)
      .setTitle(t('reminder.title', { lng }))
      .setDescription(t('reminder.reminding', { lng, message: reminder.message }));

    // Notify user in DM if possible
    const user = await client.users.fetch(reminder.userId).catch((err) => logger.debug({ err, reminder }, 'Could not fetch user'));
    if (user) {
      user.send({ embeds: [embed] }).catch((err) => logger.debug({ err, reminder }, 'Could not send reminder in DM'));
      continue;
    }
    // Notify in reminder channel if DM fails
    const channel = await client.channels.fetch(reminder.channelId).catch((err) => logger.debug({ err, reminder }, 'Could not fetch channel'));
    if (channel?.isSendable()) {
      channel.send({ embeds: [embed], content: `<@${reminder.userId}>` }).catch((err) => logger.debug({ err, reminder }, 'Could not send reminder in channel'));
      continue;
    }
  }
  // Deleting due reminders
  const deletedReminders = await deleteExpiredReminders(NOW);
  logger.debug(`[${client.cluster.id}] Deleted ${deletedReminders.deletedCount} due reminders`);
}

async function clearExpiredInfractions(client: DiscordClient) {
  // Fetch all expired infractions that have not been closed yet
  const expiredInfractions = await getUnresolvedInfractions();

  for (const infraction of expiredInfractions) {
    if (infraction.action === InfractionType.TempBan) {
      // Fetch the infraction's guild to unban the user
      const guild = await client.guilds.fetch(infraction.guildId).catch((err) => logger.debug({ err, infraction }, 'Could not fetch guild'));
      // If we can't find the guild, we can't unban so we close the infraction
      if (!guild) return closeCurrentInfraction();
      // If we have a guild, we try to unban the user and close the infraction
      await guild.bans
        .remove(infraction.userId, 'Temporary Ban has expired')
        .catch((err) => logger.debug({ err, infraction }, 'Could not unban member after tempban '));
      closeCurrentInfraction();
    } else if (infraction.action === InfractionType.Timeout) {
      // Discord handles timeouts for us so we don't need to fetch the guild and remove the timeout
      closeCurrentInfraction();
    }

    async function closeCurrentInfraction() {
      await closeInfraction(infraction._id);
      logger.debug(`[${client.cluster.id}] Closed infraction ${infraction._id}`);
    }
  }
}

import { CronJob } from 'cron';
import { Colors, EmbedBuilder } from 'discord.js';
import mongoose from 'mongoose';
import i18next from 'i18next';

import { DiscordClient } from 'classes/client';

import { guildModel } from 'models/guild';
import { infractionModel, InfractionType } from 'models/infraction';
import { reminderModel } from 'models/reminder';
import { userModel } from 'models/user';
import { weeklyLevelModel } from 'models/weeklyLevels';

import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

export function initDatabase(client: DiscordClient) {
  mongoose
    .connect(keys.DATABASE_URI)
    .then(() => {
      logger.info(`[${client.cluster.id}] Successfully connected to database`);

      client.once('ready', () => {
        collectUserLanguages(client); // Set clients user language collection
        collectGuildSettings(client); // Set clients guild settings collection

        CronJob.from({
          cronTime: '*/10 * * * * *', // every 10 seconds
          onTick: () => {
            clearExpiredInfractions(client); // Handle expired infractions
            clearWeekly(client); // Handle weekly clear
            clearReminders(client); // Handle reminders
          },
          start: true,
        });
      });
    })
    .catch((err) => logger.error(err, `[${client.cluster.id}] Failed connection to database`));
}

async function collectUserLanguages(client: DiscordClient) {
  // Loop through each collected user and set language
  for (const user of client.users.cache.values()) {
    const userData = await userModel.findOne({ userId: user.id, banned: false }, {}, { upsert: false }).lean().exec();
    if (userData && userData.language && !user.bot) client.userLanguages.set(user.id, userData.language ?? client.supportedLanguages[0]);
  }
  // Notify about collected languages
  logger.info(`[${client.cluster.id}] Collected ${client.userLanguages.size} user languages`);
}
async function collectGuildSettings(client: DiscordClient) {
  // Loop through each collected guild and set settings if found
  for (const guild of client.guilds.cache.values()) {
    const guildSettings = await guildModel.findOne({ guildId: guild.id }, {}, { upsert: false }).lean().exec();
    if (guildSettings) client.guildSettings.set(guild.id, guildSettings);
  }
  // Notify about collected guild settings
  logger.info(`[${client.cluster.id}] Collected ${client.guildSettings.size} guild settings`);
}

async function clearWeekly(client: DiscordClient) {
  const WEEK = 604800000;
  const NOW = Date.now();

  const { database } = await client.getClientSettings(keys.DISCORD_BOT_ID);

  // If now is bigger than last weekly clear plus a week
  if (NOW > database.lastWeeklyClear + WEEK) {
    // Clear weekly level
    clearWeeklyLevel(client, keys.DISCORD_BOT_ID);
  }
}

async function clearWeeklyLevel(client: DiscordClient, applicationId: string) {
  // Clear weekly level model and collection
  const clearedLevel = await weeklyLevelModel.deleteMany({});
  client.levelWeekly.clear();

  // Notify that weekly level have been cleared
  logger.info(`[${client.cluster.id}] Cleared ${clearedLevel.deletedCount} weekly level`);

  // Update last weekly level clear with current date
  await client.updateClientSettings(applicationId, { $set: { ['database.lastWeeklyClear']: Date.now() } });
}

async function clearReminders(client: DiscordClient) {
  // Store current time to avoid deleting newly expired reminders later
  const NOW = Date.now();
  // Fetch all due reminders
  const dueReminders = await reminderModel.find({ remindAt: { $lte: NOW } });

  for (const reminder of dueReminders) {
    const lng = await client.getUserLanguage(reminder.userId);
    const embed = new EmbedBuilder()
      .setColor(Colors.Aqua)
      .setTitle(i18next.t('reminder.title', { lng }))
      .setDescription(i18next.t('reminder.reminding', { lng, message: reminder.message }));

    // Notify user in DM if possible
    const user = await client.users.fetch(reminder.userId).catch(() => {});
    if (user) {
      user.send({ embeds: [embed] }).catch(() => {});
      continue;
    }
    // Notify in reminder channel if DM fails
    const channel = await client.channels.fetch(reminder.channelId).catch(() => {});
    if (channel && channel.isTextBased()) {
      channel.send({ embeds: [embed], content: `<@${reminder.userId}>` }).catch(() => {});
      continue;
    }
  }
  // Deleting due reminders
  await reminderModel.deleteMany({ remindAt: { $lte: NOW } });
}

async function clearExpiredInfractions(client: DiscordClient) {
  // Fetch all expired infractions that have not been closed yet
  const expiredInfractions = await infractionModel
    .find({ closed: false, endsAt: { $lte: Date.now() } })
    .lean()
    .exec();

  const closedInfractions = [];

  for (const infraction of expiredInfractions) {
    if (infraction.action === InfractionType.TempBan) {
      // Fetch the infraction's guild to unban the user
      const guild = await client.guilds.fetch(infraction.guildId).catch(() => {});
      // If we can't find the guild, we can't unban so we close the infraction
      if (!guild) return closeInfraction();
      // If we have a guild, we try to unban the user and close the infraction
      await guild.bans.remove(infraction.userId, 'Temporary Ban has expired').catch(() => {});
      closeInfraction();
    } else if (infraction.action === InfractionType.Timeout) {
      // Discord handles timeouts for us so we don't need to fetch the guild and remove the timeout
      closeInfraction();
    }

    async function closeInfraction() {
      await infractionModel.findByIdAndUpdate(infraction._id, { $set: { closed: true } });
      closedInfractions.push();
    }
  }

  // Notify about closed infractions
  if (closedInfractions.length > 0) logger.info(`[${client.cluster.id}] Closed ${closedInfractions.length} infractions`);
}

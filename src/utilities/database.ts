import { CronJob } from 'cron';
import type { Client } from 'discord.js';
import mongoose from 'mongoose';

import { DiscordClient } from 'classes/client';

import { guildModel } from 'models/guild';
import { infractionModel, InfractionType } from 'models/infraction';
import { userModel } from 'models/user';
import { weeklyLevelModel } from 'models/weeklyLevels';

import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

export function initDatabase(client: DiscordClient) {
  mongoose
    .connect(keys.DATABASE_URI)
    .then(() => {
      logger.info(`[${client.cluster.id}] Successfully connected to database`);

      client.once('ready', (readyClient) => {
        collectUserLanguages(client); // Set clients user language collection
        collectGuildSettings(client); // Set clients guild settings collection

        CronJob.from({
          cronTime: '* * * * *',
          onTick: () => {
            clearExpiredInfractions(client); // Handle expired infractions
            clearWeekly(client, readyClient); // Handle weekly clear
          },
          start: true,
        });
      });
    })
    .catch((err) => logger.error(err, `[${client.cluster.id}] Failed connection to database`));
}

async function collectUserLanguages(client: DiscordClient) {
  // Loop through each cached user and set language
  for (const user of client.users.cache.values()) {
    const userData = await userModel.findOne({ userId: user.id, banned: false }, {}, { upsert: false }).lean().exec();
    if (userData && userData.language && !user.bot) client.userLanguages.set(user.id, userData.language ?? client.supportedLanguages[0]);
  }
  // Notify about collected languages
  logger.info(`[${client.cluster.id}] Collected ${client.userLanguages.size} user languages`);
}
async function collectGuildSettings(client: DiscordClient) {
  // Loop through each cached guild and set settings if found
  for (const guild of client.guilds.cache.values()) {
    const guildSettings = await guildModel.findOne({ guildId: guild.id, banned: false }, {}, { upsert: false }).lean().exec();
    if (guildSettings) client.guildSettings.set(guild.id, guildSettings);
  }
  // Notify about collected guild settings
  logger.info(`[${client.cluster.id}] Collected ${client.guildSettings.size} guild settings`);
}

async function clearWeekly(client: DiscordClient, readyClient: Client<true>) {
  const WEEK = 604800000;
  const NOW = Date.now();

  const applicationId = readyClient.application.id;
  const { database } = await client.getClientSettings(applicationId);

  // If now is bigger than last weekly clear plus a week
  if (NOW > database.lastWeeklyClear + WEEK) {
    // Clear weekly level
    clearWeeklyLevel(client, applicationId);
  }
}

async function clearWeeklyLevel(client: DiscordClient, applicationId: string) {
  // Clear weekly level model and cache
  const clearedLevel = await weeklyLevelModel.deleteMany({});
  client.levelWeekly.clear();

  // Notify that weekly level have been cleared
  logger.info(`[${client.cluster.id}] Cleared ${clearedLevel.deletedCount} weekly level`);

  // Update last weekly level clear with current date
  await client.updateClientSettings(applicationId, { $set: { ['database.lastWeeklyClear']: Date.now() } });
}

async function clearExpiredInfractions(client: DiscordClient) {
  // Fetch all expired infractions that have not been closed yet
  const expiredInfractions = await infractionModel
    .find({ closed: false, endsAt: { $lte: Date.now() } })
    .lean()
    .exec();

  const closedInfractions = [];

  for (const infraction of expiredInfractions) {
    if (infraction.action === InfractionType.TEMPBAN) {
      // Fetch the infraction's guild to unban the user
      const guild = await client.guilds.fetch(infraction.guildId).catch(() => {});
      // If we can't find the guild, we can't unban so we close the infraction
      if (!guild) return closeInfraction();
      // If we have a guild, we try to unban the user and close the infraction
      await guild.bans.remove(infraction.userId, 'Temporary Ban has expired').catch(() => {});
      closeInfraction();
    } else if (infraction.action === InfractionType.TIMEOUT) {
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

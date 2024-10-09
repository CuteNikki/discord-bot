import { CronJob } from 'cron';
import { Colors, EmbedBuilder } from 'discord.js';
import { t } from 'i18next';
import { connect } from 'mongoose';
import { performance } from 'perf_hooks';

import { DiscordClient } from 'classes/client';

import { getClientSettings, updateLastWeeklyClearAt } from 'db/client';
import { deleteCustomVoiceChannel, getCustomVoiceChannels } from 'db/custom-voice-channel';
import { deleteGiveaway, getAllGiveaways, getWinners } from 'db/giveaway';
import { closeInfraction, getUnresolvedInfractions } from 'db/infraction';
import { getGuildLanguage, getUserLanguage } from 'db/language';
import { deleteWeeklyLevels } from 'db/level';
import { deleteExpiredReminders, getExpiredReminders } from 'db/reminder';

import { InfractionType, type InfractionDocument } from 'types/infraction';

import { keys } from 'constants/keys';

import type { GiveawayDocument } from 'types/giveaway';
import { sendError } from 'utils/error';
import { logger } from 'utils/logger';

export async function initDatabase(client: DiscordClient) {
  const startTime = performance.now(); // This is used for logging the time it takes to connect to the database

  await connect(keys.DATABASE_URI)
    .then(() => {
      const endTime = performance.now(); // This is used for logging the time it takes to connect to the database
      logger.info(`[${client.cluster.id}] Connected to DB (${Math.floor(endTime - startTime)}ms)`);

      client.once('ready', () => {
        CronJob.from({
          cronTime: '*/10 * * * * *', // every 10 seconds
          onTick: async () => {
            const jobStartTime = performance.now();

            // Some actions only need to be done on cluster 0
            if (client.cluster.id === 0) {
              await Promise.allSettled([
                checkWeeklyLevel(), // Check if weekly level database should be cleared
                clearReminders(client), // Clear expired reminders
                clearCustomVoiceChannels(client) // Clear all custom voice channels that could have been left empty and weren't deleted
              ]);
            }
            // These actions can be done on any cluster
            await Promise.allSettled([
              clearGiveaways(client), // Clear ended giveaways
              clearInfractions(client) // Clear expired infractions
            ]);

            const jobEndTime = performance.now();
            logger.debug(`[${client.cluster.id}] Ran DB CronJob (${Math.floor(jobEndTime - jobStartTime)}ms)`);
          },
          runOnInit: true,
          start: true
        });
      });
    })
    .catch((err) => sendError({ client, err, location: 'Mongoose Connection Error' }));
}

async function clearGiveaways(client: DiscordClient) {
  const giveaways = (await getAllGiveaways()).filter((g) => client.guilds.cache.has(g.guildId) && g.endsAt < Date.now());
  if (giveaways.length) logger.debug(`[${client.cluster.id}] Found ${giveaways.length} ended giveaways`);

  for (const giveaway of giveaways) {
    const guild = client.guilds.cache.get(giveaway.guildId);

    if (!guild) {
      continue;
    }

    const channel = await guild.channels.fetch(giveaway.channelId).catch((err) => logger.debug({ err, giveaway }, 'Could not fetch channel'));

    if (!channel?.isSendable()) {
      await deleteCurrentGiveaway(giveaway);
      continue; // Continue to the next giveaway
    }

    const winners = getWinners(giveaway.participants, giveaway.winnerIds, giveaway.winnerCount);

    const lng = await getGuildLanguage(guild.id);

    if (!winners?.length || winners.length < giveaway.winnerCount) {
      await channel
        .send({
          content: `https://discord.com/channels/${guild.id}/${channel.id}/${giveaway.messageId}`,
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.giveaway)
              .setTitle(t('giveaway.announcement.title', { lng }))
              .setDescription(
                [
                  t('giveaway.announcement.no-participants', {
                    lng,
                    count: giveaway.winnerCount,
                    winnerCount: giveaway.winnerCount.toString(),
                    prize: giveaway.prize
                  }),
                  winners.length
                    ? `${t('giveaway.announcement.determined', { lng, count: winners.length, winnerCount: winners.length.toString(), winners: winners.map((id) => `<@${id}>`).join(', ') })}`
                    : ''
                ].join('\n')
              )
          ]
        })
        .then(async () => {
          await deleteCurrentGiveaway(giveaway);
        })
        .catch((err) => logger.debug({ err, giveaway }, 'Could not send message'));
      continue; // Continue to the next giveaway
    }

    await channel
      .send({
        content: `https://discord.com/channels/${guild.id}/${channel.id}/${giveaway.messageId}`,
        embeds: [
          new EmbedBuilder()
            .setColor(client.colors.giveaway)
            .setTitle(t('giveaway.announcement.title', { lng }))
            .setDescription(
              t('giveaway.announcement.description', { lng, winners: winners.map((id) => `<@${id}>`).join(', '), count: winners.length, prize: giveaway.prize })
            )
        ]
      })
      .then(async () => {
        await deleteCurrentGiveaway(giveaway);
      })
      .catch((err) => logger.debug({ err, giveaway }, 'Could not send message'));
  }

  async function deleteCurrentGiveaway(giveaway: GiveawayDocument) {
    await deleteGiveaway(giveaway._id);
    logger.debug(giveaway, `[${client.cluster.id}] Deleted giveaway`);
  }
}

async function clearCustomVoiceChannels(client: DiscordClient) {
  const customVoiceChannels = await getCustomVoiceChannels();
  if (customVoiceChannels.length) logger.debug(`[${client.cluster.id}] Found ${customVoiceChannels.length} custom voice channels`);

  // Iterate through each custom voice channel in the database
  for (const customVoiceChannel of customVoiceChannels) {
    // Fetch the channel to check if it still exists
    const channel = await client.channels
      .fetch(customVoiceChannel.channelId)
      .catch((err) => logger.debug({ err, customVoiceChannel }, 'Could not fetch channel'));

    // If we can't find the channel, delete it from the database
    if (!channel) {
      return await deleteCustomVoiceChannel(customVoiceChannel.channelId);
    }

    // If the channel is empty, delete it
    if (channel.isVoiceBased() && !channel.members.size) {
      await channel
        .delete()
        .then(async () => {
          await deleteCustomVoiceChannel(customVoiceChannel.channelId);
          logger.debug(customVoiceChannel, `[${client.cluster.id}] Deleted custom voice channel`);
        })
        .catch((err) => logger.debug({ err, customVoiceChannel }, 'Could not delete custom voice channel'));
    }
  }
}

async function checkWeeklyLevel() {
  const WEEK = 604800000;
  const NOW = Date.now();

  const { database } = await getClientSettings(keys.DISCORD_BOT_ID);

  // If now is bigger than last weekly clear plus a week, clear weekly database
  if (NOW > database.lastWeeklyClearAt + WEEK) {
    clearWeeklyLevelDatabase(keys.DISCORD_BOT_ID);
  }
}

async function clearWeeklyLevelDatabase(applicationId: string) {
  const clearedLevel = await deleteWeeklyLevels();
  logger.debug(`\nClearing Weekly Levels!\n${clearedLevel.deletedCount} Documents have been deleted.\n`);
  await updateLastWeeklyClearAt(applicationId, Date.now());
}

async function clearReminders(client: DiscordClient) {
  // Store current time to avoid deleting newly expired reminders later
  const NOW = Date.now();
  // Fetch all due reminders
  const dueReminders = await getExpiredReminders(NOW);

  for (const reminder of dueReminders) {
    const lng = await getUserLanguage(reminder.userId);

    // Notify user in DM if possible
    const user = await client.users.fetch(reminder.userId).catch((err) => logger.debug({ err, reminder }, 'Could not fetch user'));
    if (user) {
      user
        .send({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Aqua)
              .setTitle(t('reminder.title', { lng }))
              .setDescription(t('reminder.reminding', { lng, message: reminder.message }))
          ]
        })
        .catch((err) => logger.debug({ err, user, reminder }, 'Could not send reminder in DM'));
      continue;
    }
  }
  // Deleting due reminders
  const deletedReminders = await deleteExpiredReminders(NOW);
  if (deletedReminders.deletedCount) logger.debug(`[${client.cluster.id}] Deleted ${deletedReminders.deletedCount} due reminders`);
}

async function clearInfractions(client: DiscordClient) {
  // Fetch all expired infractions that have not been closed yet
  const expiredInfractions = await getUnresolvedInfractions();
  if (expiredInfractions.length) logger.debug(`[${client.cluster.id}] Found ${expiredInfractions.length} expired infractions`);

  for (const infraction of expiredInfractions) {
    if (infraction.action === InfractionType.TempBan) {
      // Fetch the infraction's guild to unban the user
      const guild = client.guilds.cache.get(infraction.guildId);
      // If we can't find the guild, we can't unban so we close the infraction
      if (!guild) {
        continue;
      }
      // If we have a guild, we try to unban the user and close the infraction
      await guild.bans
        .remove(infraction.userId, 'Temporary Ban has expired')
        .then(async () => {
          await closeCurrentInfraction(infraction);
          logger.debug(`[${client.cluster.id}] Unbanned user ${infraction.userId} from guild ${infraction.guildId}`);
        })
        .catch((err) => logger.debug({ err, infraction }, 'Could not unban member after tempban '));
    } else if (infraction.action === InfractionType.Timeout && client.cluster.id === 0) {
      // To avoid multiple writes to the database we only do this on cluster 0

      // Discord handles timeouts for us so we don't need to fetch the guild and remove the timeout
      await closeCurrentInfraction(infraction);
    }
  }

  async function closeCurrentInfraction(infraction: InfractionDocument) {
    await closeInfraction(infraction._id);
    logger.debug(infraction, `[${client.cluster.id}] Closed infraction`);
  }
}

import { CronJob } from 'cron';
import mongoose from 'mongoose';

import type { DiscordClient } from 'classes/client';

import { InfractionType, infractionModel } from 'models/infraction';
import { userModel } from 'models/user';
import { weeklyLevelModel } from 'models/weeklyLevels';

import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

export function connectDatabase(client: DiscordClient) {
  mongoose
    .connect(keys.DATABASE_URI)
    .then(() => {
      logger.info(`[${client.cluster.id}] Connected to database`);

      // Takes care of anything DB related
      manage(client);
    })
    .catch((err) => logger.error(err, `[${client.cluster.id}] Could not connect to database`));
}

export async function manage(client: DiscordClient) {
  client.once('ready', () => {
    // Cache user language preferences
    cacheLanguages(client);

    // Interval to take care of anything that expires
    CronJob.from({
      cronTime: '*/1 * * * *',
      onTick: async () => {
        await manageInfractions(client);
      },
      start: true,
    });

    // Clear weekly levels on every Sunday at 00:00
    CronJob.from({
      cronTime: '0 0 * * 0',
      onTick: async () => {
        await clearWeeklyLevels(client);
      },
      start: true,
    });
  });
}

export async function cacheLanguages(client: DiscordClient) {
  // Loop through users set their preferred language
  for (const user of client.users.cache.values()) {
    const userData = await userModel.findOne({ userId: user.id }, {}, { upsert: false }).lean().exec();
    if (userData && userData.language) client.userLanguages.set(user.id, userData.language);
  }

  logger.info(`[${client.cluster.id}] ${client.userLanguages.size} user language preferences cached`);
}

export async function clearWeeklyLevels(client: DiscordClient) {
  const levels = await weeklyLevelModel.deleteMany({});
  client.levelsWeekly.clear();
  logger.info(`[${client.cluster.id}] CLEARED ${levels.deletedCount} WEEKLY LEVELS`);
}

export async function manageInfractions(client: DiscordClient) {
  // Grab infractions where ended is false and the endsAt is less than or equal to the current time
  const infractions = await infractionModel
    .find({ ended: false, endsAt: { $lte: Date.now() } })
    .lean()
    .exec();

  const cleanedInfractions: any[] = [];
  for (const infraction of infractions) {
    // Unban users from guilds if their temporary ban expired
    if (infraction.action === InfractionType.TEMPBAN) {
      const guild = client.guilds.cache.get(infraction.guildId);
      if (guild) {
        const removed = await guild.bans.remove(infraction.userId, 'Temporary ban has expired').catch(() => {});
        if (removed) {
          await infractionModel.findByIdAndUpdate(infraction._id, { $set: { ended: true } });
          cleanedInfractions.push(infraction);
        }
      }
    } else if (infraction.action === InfractionType.TIMEOUT) {
      // Discord takes care of removing timeouts for us so we only need to set ended to true
      await infractionModel.findByIdAndUpdate(infraction._id, { $set: { ended: true } });
      cleanedInfractions.push(infraction);
    }
  }

  if (cleanedInfractions.length > 0) logger.info(`[${client.cluster.id}] Cleaned up ${cleanedInfractions.length}/${infractions.length} infractions`);
}

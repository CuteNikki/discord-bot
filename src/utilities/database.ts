import { CronJob } from 'cron';
import mongoose from 'mongoose';

import type { DiscordClient } from 'classes/client';

import { InfractionType, infractionModel } from 'models/infraction';
import { userModel } from 'models/user';

import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

export function connectDatabase(client: DiscordClient) {
  mongoose
    .connect(keys.DATABASE_URI)
    .then(() => {
      logger.info('Connected to database');

      // Takes care of anything DB related
      resolve(client);
    })
    .catch((err) => logger.error(err, `Could not connect to database`));
}

export async function resolve(client: DiscordClient) {
  // Sync users language preference
  syncLanguages(client);

  // Runs every minute to take care of anything that expires
  CronJob.from({
    cronTime: '*/1 * * * *',
    onTick: async () => {
      await resolveInfractions(client);
    },
    start: true,
  });
}

export async function syncLanguages(client: DiscordClient) {
  // Get all user documents
  const users = await userModel.find().lean().exec();
  // Loop through users and fill collections
  for (const user of users) {
    client.userLanguages.set(user.userId, user.language);
  }

  logger.info(`Synced ${users.length} user language preferences`);
}

export async function resolveInfractions(client: DiscordClient) {
  // Grab infractions where ended is false and the endsAt is less than or equal to the current time
  const infractions = await infractionModel
    .find({ ended: false, endsAt: { $lte: Date.now() } })
    .lean()
    .exec();

  for (const infraction of infractions) {
    // Unban users from guilds if their temporary ban expired
    if (infraction.action === InfractionType.TEMPBAN) {
      const guild = await client.guilds.fetch(infraction.guildId).catch(() => {});
      await infractionModel.findByIdAndUpdate(infraction._id, { $set: { ended: true } });
      if (guild) await guild.bans.remove(infraction.userId, 'Temporary ban has expired').catch(() => {});
    } else if (infraction.action === InfractionType.TIMEOUT) {
      // Discord takes care of removing mutes for us so we only need to set ended to true
      await infractionModel.findByIdAndUpdate(infraction._id, { $set: { ended: true } });
    }
  }

  logger.info(`Cleaned up ${infractions.length} infractions`);
}

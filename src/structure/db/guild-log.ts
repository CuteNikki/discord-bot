import type { UpdateQuery } from 'mongoose';

import { updateGuild } from 'db/guild';
import { guildLogModel } from 'models/guild-log';

import type { GuildLogDocument } from 'types/guild-log';

export async function getGuildLog<T extends boolean>(
  guildId: string,
  insert: T = false as T
): Promise<T extends true ? GuildLogDocument : GuildLogDocument | null> {
  const document = await guildLogModel.findOne({ guildId });

  if (!document && insert) {
    await updateGuildLog(guildId, {});
  }

  return document as T extends true ? GuildLogDocument : GuildLogDocument | null;
}

async function updateGuildLog(guildId: string, query: UpdateQuery<GuildLogDocument>) {
  const document = await guildLogModel.findOneAndUpdate({ guildId }, query, { new: true, upsert: true }).lean().exec();

  await updateGuild(guildId, { $set: { log: document._id } });

  return document;
}

export async function enableGuildLog(guildId: string) {
  return updateGuildLog(guildId, { $set: { enabled: true } });
}

export async function disableGuildLog(guildId: string) {
  return updateGuildLog(guildId, { $set: { enabled: false } });
}

export async function enableGuildLogEvent(guildId: string, event: string, channelId: string) {
  await updateGuildLog(guildId, {
    $pull: {
      events: {
        name: event
      }
    }
  });
  await updateGuildLog(guildId, {
    $push: {
      events: {
        name: event,
        channelId,
        enabled: true
      }
    }
  });
}

export async function enableGuildLogEvents(guildId: string, events: string[], channelId: string) {
  await updateGuildLog(guildId, {
    $pull: {
      events: {
        name: { $in: events }
      }
    }
  });
  await updateGuildLog(guildId, {
    $push: {
      events: {
        $each: events.map((event) => ({
          name: event,
          channelId,
          enabled: true
        }))
      }
    }
  });
}

export async function disableGuildLogEvent(guildId: string, event: string, channelId?: string) {
  await updateGuildLog(guildId, {
    $pull: {
      events: {
        name: event
      }
    }
  });
  await updateGuildLog(guildId, {
    $push: {
      events: {
        name: event,
        channelId,
        enabled: false
      }
    }
  });
}

export async function disableGuildLogEvents(guildId: string, events: { name: string; channelId?: string }[]) {
  await updateGuildLog(guildId, {
    $pull: {
      events: {
        name: {
          $in: events.map((event) => event.name)
        }
      }
    }
  });
  await updateGuildLog(guildId, {
    $push: {
      events: {
        $each: events.map((event) => ({
          name: event.name,
          channelId: event.channelId,
          enabled: false
        }))
      }
    }
  });
}

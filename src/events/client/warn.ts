import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.Warn,
  once: false,
  execute(client, message) {
    logger.warn(`[${client.cluster.id}] ${message}`);
  }
});

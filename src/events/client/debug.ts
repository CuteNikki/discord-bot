import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.Debug,
  once: false,
  execute(client, message) {
    logger.debug(`[${client.cluster.id}] ${message}`);
  },
});

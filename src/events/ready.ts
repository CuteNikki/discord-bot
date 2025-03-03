import { Events } from 'discord.js';

import { Event } from 'classes/event';

import logger from 'utility/logger';

export default new Event({
  name: Events.ClientReady,
  once: true,
  execute(_extendedClient, readyClient) {
    logger.info(`Logged in as ${readyClient.user.tag}`);
  },
});

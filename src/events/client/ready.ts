import { Events } from 'discord.js';

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: Events.ClientReady,
  once: true,
  execute(client, readyClient) {
    logger.info(`[${client.cluster.id}] Ready as ${readyClient.user.username}#${readyClient.user.discriminator}`);
  },
});

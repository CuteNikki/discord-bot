import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: 'ready',
  once: true,
  execute(client, readyClient) {
    logger.info(`[${client.cluster.id}] Ready as ${readyClient.user.username}#${readyClient.user.discriminator}`);
  },
});

import { Event } from 'classes/event';

import { logger } from 'utils/logger';

export default new Event({
  name: 'ready',
  once: true,
  execute(client) {
    setTimeout(() => {
      client.usable = true;
      logger.info(`[${client.cluster.id}] Client is ready`);
    }, 5000);
  },
});

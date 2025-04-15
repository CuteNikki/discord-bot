import { performance } from 'perf_hooks';

import type { ExtendedClient } from 'classes/client';
import type { Event } from 'classes/event';

import { getEventFiles } from 'utility/files';
import logger from 'utility/logger';

export async function loadEvents(client: ExtendedClient) {
  logger.debug('Loading event files');
  const startTime = performance.now();

  const { eventFiles } = getEventFiles();

  for (const filePath of eventFiles) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = (await import(filePath)).default as Event<any>;

    if ('name' in event.options && 'execute' in event.options) {
      if (event.options.once) {
        client.once(event.options.name, (...args: unknown[]) => event.options.execute(client, ...args));
      } else {
        client.on(event.options.name, (...args: unknown[]) => event.options.execute(client, ...args));
      }

      logger.debug(`Loaded event file ${filePath}`);
    } else {
      logger.warn(`Event file ${filePath} is missing name or execute`);
    }
  }

  const endTime = performance.now();
  logger.info(
    `Loaded ${eventFiles.length} event${eventFiles.length > 1 || eventFiles.length === 0 ? 's' : ''} in ${Math.floor(endTime - startTime)}ms`,
  );
}

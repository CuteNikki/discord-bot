import fs from 'fs';
import path from 'path';

import type { DiscordClient } from 'classes/client';
import { logger } from 'utils/logger';

export async function loadEvents(client: DiscordClient) {
  const foldersPath = path.join(process.cwd(), 'src/events');
  const folders = fs.readdirSync(foldersPath).filter((value) => !value.endsWith('.txt'));

  for (const folder of folders) {
    const eventsPath = path.join(foldersPath, folder);
    const files = fs.readdirSync(eventsPath).filter((value) => value.endsWith('.ts'));

    for (const file of files) {
      const filePath = path.join(eventsPath, file);
      const event = await import(filePath);

      const listener = (...args: any[]) => event.default.options.execute(client, ...args);
      client.events.set(`${client.events.size + 1}_${event.default.options.name}`, listener);

      if (event.default.options.once) {
        client.prependOnceListener(event.default.options.name, listener);
      } else {
        client.addListener(event.default.options.name, listener);
      }
    }
  }

  logger.info('Successfully loaded events');
}

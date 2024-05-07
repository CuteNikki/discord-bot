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
      const event = await import('file://' + filePath);

      if (event.default.options.once) {
        client.once(event.default.options.name, (...args: any[]) => event.default.options.execute(client, ...args));
      } else {
        client.on(event.default.options.name, (...args: any[]) => event.default.options.execute(client, ...args));
      }
    }
  }

  logger.info(`[${client.cluster.id}] Successfully loaded events`);
}

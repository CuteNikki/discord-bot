import type { Client } from 'discord.js';
import fs from 'fs';
import path from 'path';

import { performance } from 'perf_hooks';

import logger from 'utility/logger';

export async function loadEvents(client: Client) {
  logger.debug('Loading event files');
  const startTime = performance.now();

  const { eventFiles } = getEventFiles();

  for (const filePath of eventFiles) {
    const event = await import(filePath);

    if ('name' in event.default && 'execute' in event.default) {
      if (event.default.once) {
        client.once(event.default.name, (...args: unknown[]) => event.default.execute(...args));
      } else {
        client.on(event.default.name, (...args: unknown[]) => event.default.execute(...args));
      }

      logger.debug(`Loaded event file ${filePath}`);
    } else {
      logger.warn(`Event file ${filePath} is missing name or execute`);
    }
  }

  const endTime = performance.now();
  logger.info(`Loaded ${eventFiles.length} event${eventFiles.length > 1 || eventFiles.length === 0 ? 's' : ''} in ${Math.floor(endTime - startTime)}ms`);
}

function getEventFiles() {
  const eventPath = path.join(process.cwd(), 'src/events');
  const eventFiles = getAllFiles(eventPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  return { eventPath, eventFiles };
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

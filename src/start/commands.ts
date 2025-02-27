import fs from 'fs';
import path from 'path';

import { performance } from 'perf_hooks';

import type { ExtendedClient } from 'classes/client';

import logger from 'utility/logger';

export async function loadCommands(client: ExtendedClient) {
  logger.debug('Loading command files');

  const startTime = performance.now();

  const { cmdPath, cmdFiles } = getCommandFiles();

  for (const file of cmdFiles) {
    const filePath = path.join(cmdPath, file);
    const command = await import(filePath);

    if ('data' in command.default && 'execute' in command.default) {
      client.commands.set(command.default.data.name, command.default);

      logger.debug(`Loaded command file ${file}`);
    } else {
      logger.warn(`Command file ${file} is missing data or execute`);
    }
  }

  const endTime = performance.now();
  logger.info(`Loaded ${cmdFiles.length} command${cmdFiles.length > 1 || cmdFiles.length === 0 ? 's' : ''} in ${Math.floor(endTime - startTime)}ms`);
}

export function getCommandFiles() {
  const cmdPath = path.join(process.cwd(), 'src/commands');
  const cmdFiles = fs.readdirSync(cmdPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  return { cmdPath, cmdFiles };
}

import fs from 'fs';
import path from 'path';

import { performance } from 'perf_hooks';

import type { ExtendedClient } from 'classes/client';

import logger from 'utility/logger';

export async function loadCommands(client: ExtendedClient) {
  logger.debug('Loading command files');

  const startTime = performance.now();

  const { cmdFiles } = getCommandFiles();

  for (const filePath of cmdFiles) {
    const command = await import(filePath);

    if ('data' in command.default && 'execute' in command.default) {
      client.commands.set(command.default.data.name, command.default);

      logger.debug(`Loaded command file ${filePath}`);
    } else {
      logger.warn(`Command file ${filePath} is missing data or execute`);
    }
  }

  const endTime = performance.now();
  logger.info(`Loaded ${cmdFiles.length} command${cmdFiles.length > 1 || cmdFiles.length === 0 ? 's' : ''} in ${Math.floor(endTime - startTime)}ms`);
}

export function getCommandFiles() {
  const cmdPath = path.join(process.cwd(), 'src/commands');
  const cmdFiles = getAllFiles(cmdPath).filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

  return { cmdPath, cmdFiles };
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

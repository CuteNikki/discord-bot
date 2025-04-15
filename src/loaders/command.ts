import { performance } from 'perf_hooks';

import type { ExtendedClient } from 'classes/client';
import type { Command } from 'classes/command';

import { getCommandFiles } from 'utility/files';
import logger from 'utility/logger';

export async function loadCommands(client: ExtendedClient) {
  logger.debug('Loading command files');

  const startTime = performance.now();

  const { cmdFiles } = getCommandFiles();

  for (const filePath of cmdFiles) {
    const command = (await import(filePath)).default as Command;

    if ('builder' in command.options && 'execute' in command.options) {
      client.commands.set(command.options.builder.name, command);

      logger.debug(`Loaded command file ${filePath}`);
    } else {
      logger.warn(`Command file ${filePath} is missing data or execute`);
    }
  }

  const endTime = performance.now();
  logger.info(
    `Loaded ${cmdFiles.length} command${cmdFiles.length > 1 || cmdFiles.length === 0 ? 's' : ''} in ${Math.floor(endTime - startTime)}ms`,
  );
}

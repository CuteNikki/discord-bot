import { performance } from 'perf_hooks';

import type { ExtendedClient } from 'classes/client';

import { getButtonFiles } from 'utility/files';
import logger from 'utility/logger';

export async function loadButtons(client: ExtendedClient) {
  logger.debug('Loading button files');

  const startTime = performance.now();

  const { buttonFiles } = getButtonFiles();

  for (const filePath of buttonFiles) {
    const button = (await import(filePath)).default;

    if ('options' in button && 'execute' in button.options) {
      client.buttons.set(button.options.customId, button);

      logger.debug(`Loaded button file ${filePath}`);
    } else {
      logger.warn(`Button file ${filePath} is missing data or execute`);
    }
  }

  const endTime = performance.now();

  logger.info(
    `Loaded ${buttonFiles.length} button${buttonFiles.length > 1 || buttonFiles.length === 0 ? 's' : ''} in ${Math.floor(endTime - startTime)}ms`,
  );
}

import { performance } from 'perf_hooks';

import type { ExtendedClient } from 'classes/client';

import { getModalFiles } from 'utility/files';
import logger from 'utility/logger';

export async function loadModals(client: ExtendedClient) {
  logger.debug('Loading modal files');

  const startTime = performance.now();

  const { modalFiles } = getModalFiles();

  for (const filePath of modalFiles) {
    const modal = (await import(filePath)).default;

    if ('options' in modal && 'execute' in modal.options) {
      client.modals.set(modal.options.customId, modal);

      logger.debug(`Loaded button file ${filePath}`);
    } else {
      logger.warn(`Modal file ${filePath} is missing data or execute`);
    }
  }

  const endTime = performance.now();

  logger.info(
    `Loaded ${modalFiles.length} modal${modalFiles.length > 1 || modalFiles.length === 0 ? 's' : ''} in ${Math.floor(endTime - startTime)}ms`,
  );
}

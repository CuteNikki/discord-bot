import { performance } from 'perf_hooks';

import type { ExtendedClient } from 'classes/client';

import { getSelectFiles } from 'utility/files';
import logger from 'utility/logger';

export async function loadSelectMenus(client: ExtendedClient) {
  logger.debug('Loading select menu files');

  const startTime = performance.now();

  const { selectFiles } = getSelectFiles();

  for (const filePath of selectFiles) {
    const selectMenu = (await import(filePath)).default;

    if ('options' in selectMenu && 'execute' in selectMenu.options) {
      client.selectMenus.set(selectMenu.options.customId, selectMenu);

      logger.debug(`Loaded select menu file ${filePath}`);
    } else {
      logger.warn(`Select menu file ${filePath} is missing data or execute`);
    }
  }

  const endTime = performance.now();

  logger.info(
    `Loaded ${selectFiles.length} select menu${selectFiles.length > 1 || selectFiles.length === 0 ? 's' : ''} in ${Math.floor(endTime - startTime)}ms`,
  );
}

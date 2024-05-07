import fs from 'fs';
import path from 'path';

import type { DiscordClient } from 'classes/client';

import { logger } from 'utils/logger';

export async function loadModals(client: DiscordClient) {
  const foldersPath = path.join(process.cwd(), 'src/modals');
  const folders = fs.readdirSync(foldersPath).filter((value) => !value.endsWith('.txt'));

  for (const folder of folders) {
    const modalsPath = path.join(foldersPath, folder);
    const files = fs.readdirSync(modalsPath).filter((value) => value.endsWith('.ts'));

    for (const file of files) {
      const filePath = path.join(modalsPath, file);
      const modal = await import('file://' + filePath);

      if (!modal.default) {
        logger.error(filePath, `Failed to load modal`);
        continue;
      }

      client.modals.set(modal.default.options.customId, modal.default);
    }
  }

  logger.info('Successfully loaded modals');
}

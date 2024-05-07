import fs from 'fs';
import path from 'path';

import type { DiscordClient } from 'classes/client';

import { logger } from 'utils/logger';

export async function loadButtons(client: DiscordClient) {
  const foldersPath = path.join(process.cwd(), 'src/buttons');
  const folders = fs.readdirSync(foldersPath).filter((value) => !value.endsWith('.txt'));

  for (const folder of folders) {
    const buttonsPath = path.join(foldersPath, folder);
    const files = fs.readdirSync(buttonsPath).filter((value) => value.endsWith('.ts'));

    for (const file of files) {
      const filePath = path.join(buttonsPath, file);
      const button = await import('file://' + filePath);

      if (!button.default) {
        logger.error(filePath, `Failed to load button`);
        continue;
      }

      client.buttons.set(button.default.options.customId, button.default);
    }
  }

  logger.info(`[${client.cluster.id}] Successfully loaded buttons`);
}

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
      const button = await import(filePath);

      if (!button.default) {
        logger.error('Failed to load button', filePath);
        continue;
      }

      client.buttons.set(button.default.options.customId, button.default);
    }
  }

  logger.info('Successfully loaded buttons');
}

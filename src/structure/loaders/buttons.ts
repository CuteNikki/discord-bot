import { readdir } from 'node:fs/promises';
import { performance } from 'perf_hooks';

import type { Button } from 'classes/button';
import type { DiscordClient } from 'classes/client';

import { logger } from 'utils/logger';

export async function loadButtons(client: DiscordClient) {
  const startTime = performance.now();

  const path = process.cwd() + '/src/buttons/';
  const files = await readdir(path, { recursive: true });

  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

    try {
      const imported: { default?: Button } = await import('file://' + path + file);
      if (!imported?.default?.options?.customId) continue;

      client.buttons.set(imported.default.options.customId, imported.default);
    } catch (err) {
      logger.error({ err }, `Error while loading button (${file})`);
      continue;
    }
  }

  const endTime = performance.now();
  logger.info(`[${client.cluster.id}] Loaded ${client.buttons.size} buttons in ${Math.floor(endTime - startTime)}ms`);
}

import { readdir } from 'node:fs/promises';
import { performance } from 'perf_hooks';

import type { DiscordClient } from 'classes/client';
import type { Selection } from 'classes/selection';

import { logger } from 'utils/logger';

export async function loadSelections(client: DiscordClient) {
  const startTime = performance.now();

  const path = process.cwd() + '/src/interactions/selections/';
  const files = await readdir(path, { recursive: true });

  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

    try {
      const imported: { default?: Selection } = await import('file://' + path + file);
      if (!imported?.default?.options?.customId) continue;

      client.selections.set(imported.default.options.customId, imported.default);
    } catch (err) {
      logger.error({ err }, `Error while loading selection (${file})`);
      continue;
    }
  }

  const endTime = performance.now();
  logger.info(`[${client.cluster.id}] Loaded ${client.selections.size} selections in ${Math.floor(endTime - startTime)}ms`);
}

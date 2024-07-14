import { readdir } from 'node:fs/promises';
import { performance } from 'perf_hooks';

import type { DiscordClient } from 'classes/client';
import type { Modal } from 'classes/modal';

import { logger } from 'utils/logger';

export async function loadModals(client: DiscordClient) {
  const startTime = performance.now();

  const path = process.cwd() + '/src/modals/';
  const files = await readdir(path, { recursive: true });

  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

    try {
      const imported: { default?: Modal } = await import('file://' + path + file);
      if (!imported?.default?.options?.customId) continue;

      client.modals.set(imported.default.options.customId, imported.default);
    } catch (e) {
      logger.error(e, `Error while loading modal (${file})`);
      continue;
    }
  }

  const endTime = performance.now();
  logger.info(`[${client.cluster.id}] Loaded ${client.modals.size} modals in ${Math.floor(endTime - startTime)}ms`);
}

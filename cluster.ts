import { ClusterManager, HeartbeatManager } from 'discord-hybrid-sharding';

import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

// Check if config variables are set
if (Object.values(keys).includes('value_not_found')) throw new Error('Not all config variables are defined!');

// Create a cluster manager
const manager = new ClusterManager(`${process.cwd()}/src/bot.ts`, {
  token: keys.DISCORD_BOT_TOKEN,
  mode: 'process',
  shardsPerClusters: 2,
  totalShards: 'auto',
  execArgv: [...process.execArgv],
});

manager.extend(new HeartbeatManager({ maxMissedHeartbeats: 5, interval: 5000 }));

// Setup cluster events
manager.on('clusterCreate', (cluster) => {
  cluster.on('spawn', (_thread) => logger.info(`[${cluster.id}] CLUSTER SPAWN`));
  cluster.on('death', (cluster, _thread) => logger.fatal(`[${cluster.id}] CLUSTER DEATH`));
  cluster.on('error', (error) => logger.error(error, `[${cluster.id}] CLUSTER ERROR`));
  cluster.on('message', (message) => logger.info(message, `[${cluster.id}] CLUSTER MESSAGE`));
});

manager.spawn({ timeout: -1 });

/**
 * IGNORE (SAVED FOR WHEN NEEDED)
 * https://www.i18next.com/translation-function/plurals#singular-plural
 * https://www.i18next.com/translation-function/plurals#languages-with-multiple-plurals
 */

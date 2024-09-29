import { ClusterManager, HeartbeatManager } from 'discord-hybrid-sharding';

import { keys } from 'constants/keys';
import { logger } from 'utils/logger';

// Create a cluster manager
const manager = new ClusterManager(`${process.cwd()}/src/bot.ts`, {
  token: keys.DISCORD_BOT_TOKEN,
  mode: 'process',
  shardsPerClusters: 10,
  totalShards: 'auto',
  execArgv: process.execArgv,
  shardArgs: process.argv
});

// Setup cluster events
manager.on('clusterCreate', (cluster) => {
  cluster.on('spawn', () => logger.info(`[${cluster.id}] CLUSTER SPAWN`));
  cluster.on('death', (cluster) => logger.fatal(`[${cluster.id}] CLUSTER DEATH`));
  cluster.on('err', (err) => logger.error({ err }, `[${cluster.id}] CLUSTER ERROR`));
  cluster.on('message', (message) => logger.info(message, `[${cluster.id}] CLUSTER MESSAGE`));
});

// Cluster will respawn after missing 4 heartbeats in a 5 second interval (unresponsive for 20 seconds)
manager.extend(new HeartbeatManager({ maxMissedHeartbeats: 4, interval: 5_000 }));

// Start spawning clusters
manager.spawn({ timeout: Infinity });

import { Shard, ShardingManager } from 'discord.js';
import mongoose from 'mongoose';

import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

// Check if config variables are set
if (Object.values(keys).includes('value_not_found')) throw new Error('Not all config variables are defined!');

// Connect to database
await mongoose
  .connect(keys.DATABASE_URI)
  .then(() => logger.info('Connected to database'))
  .catch((err) => logger.error('Could not connect to database', err));

// Create a discord sharding manager
const manager = new ShardingManager('./src/bot.ts', { token: keys.DISCORD_BOT_TOKEN });

// Setup shard events
manager.on('shardCreate', (shard: Shard) => {
  shard.on('ready', () => logger.info(`[${shard.id}] SHARD READY`));
  shard.on('death', (_process) => logger.fatal(`[${shard.id}] SHARD DEATH`));
  shard.on('disconnect', () => logger.fatal(`[${shard.id}] SHARD DISCONNECT`));
  shard.on('error', (error) => logger.error(`[${shard.id}] SHARD ERROR`, error));
  shard.on('message', (message) => logger.info(`[${shard.id}] SHARD MESSAGE`, message));
  shard.on('reconnecting', () => logger.info(`[${shard.id}] SHARD RECONNECTING`));
  shard.on('resume', () => logger.info(`[${shard.id}] SHARD RESUME`));
  shard.on('spawn', () => logger.info(`[${shard.id}] SHARD SPAWN`));
});

manager.spawn();

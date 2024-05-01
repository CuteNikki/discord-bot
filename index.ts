import { Shard, ShardingManager } from 'discord.js';

import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

// Check if config variables are set
if (Object.values(keys).includes('value_not_found')) throw new Error('Not all config variables are defined!');

// Create a discord sharding manager
const manager = new ShardingManager('./src/bot.ts', { token: keys.DISCORD_BOT_TOKEN });

// Setup shard events
manager.on('shardCreate', (shard: Shard) => {
  shard.on('ready', () => logger.info(`[${shard.id}] SHARD READY`));
  shard.on('death', (process) => logger.fatal(process, `[${shard.id}] SHARD DEATH`));
  shard.on('disconnect', () => logger.fatal(`[${shard.id}] SHARD DISCONNECT`));
  shard.on('error', (error) => logger.error(error, `[${shard.id}] SHARD ERROR`));
  shard.on('message', (message) => logger.info(message, `[${shard.id}] SHARD MESSAGE`));
  shard.on('reconnecting', () => logger.info(`[${shard.id}] SHARD RECONNECTING`));
  shard.on('resume', () => logger.info(`[${shard.id}] SHARD RESUME`));
  shard.on('spawn', () => logger.info(`[${shard.id}] SHARD SPAWN`));
});

manager.spawn();

/**
 * IGNORE (SAVED FOR WHEN NEEDED)
 * https://www.i18next.com/translation-function/plurals#singular-plural
 * https://www.i18next.com/translation-function/plurals#languages-with-multiple-plurals
 */

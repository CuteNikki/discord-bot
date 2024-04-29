import { Shard, ShardingManager } from 'discord.js';

const manager = new ShardingManager('./src/bot.ts', { token: process.env.DISCORD_BOT_TOKEN });

manager.on('shardCreate', (shard: Shard) => {
  shard.on('ready', () => console.log(`[${shard.id}] shard ready`));
  shard.on('death', (_process) => console.log(`[${shard.id}] shard died`));
  shard.on('disconnect', () => console.log(`[${shard.id}] shard disconnected`));
  shard.on('error', (error) => console.log(`[${shard.id}] shard error:`, error));
  shard.on('message', (message) => console.log(`[${shard.id}] shard message:`, message));
  shard.on('reconnecting', () => console.log(`[${shard.id}] shard reconnecting`));
  shard.on('resume', () => console.log(`[${shard.id}] shard resumed`));
  shard.on('spawn', () => console.log(`[${shard.id}] shard spawned`));
});

manager.spawn();

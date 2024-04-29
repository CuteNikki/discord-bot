import { Shard, ShardingManager } from 'discord.js';

const manager = new ShardingManager('./src/bot.ts', { token: process.env.DISCORD_BOT_TOKEN });

manager.on('shardCreate', (shard: Shard) => console.log(`Launched shard ${shard.id}!`));

manager.spawn();

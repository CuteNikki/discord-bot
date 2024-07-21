import { Collection, REST, Routes } from 'discord.js';

import { readdir } from 'node:fs/promises';
import { performance } from 'perf_hooks';

import { ModuleType, type Command } from 'classes/command';

import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

const commands = new Collection<string, Command>();

const startTime = performance.now();

const path = process.cwd() + '/src/commands/';
const files = await readdir(path, { recursive: true });

for (const file of files) {
  if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

  try {
    const imported: { default?: Command } = await import('file://' + path + file);
    if (!imported?.default?.options?.data?.name) continue;

    commands.set(imported.default.options.data.name, imported.default);
  } catch (e) {
    logger.error(e, `Error while loading command (${file})`);
    continue;
  }
}

const endTime = performance.now();
logger.info(`Loaded ${commands.size} commands in ${Math.floor(endTime - startTime)}ms`);

const { DISCORD_BOT_ID, DISCORD_BOT_TOKEN } = keys;
const rest = new REST().setToken(DISCORD_BOT_TOKEN);

const commandsArray = commands.filter((cmd) => !cmd.options.isDeveloperOnly && cmd.options.module !== ModuleType.Developer).map((cmd) => cmd.options.data);
const devCommandsArray = commands.filter((cmd) => cmd.options.isDeveloperOnly || cmd.options.module === ModuleType.Developer).map((cmd) => cmd.options.data);

try {
  const startTime = performance.now();
  await rest.put(Routes.applicationCommands(DISCORD_BOT_ID), { body: commandsArray });
  const endTime = performance.now();

  logger.info(`Registered ${commandsArray.length} application commands in ${Math.floor(endTime - startTime)}ms`);
} catch (err) {
  logger.error(err, 'Failed to register commands');
}

for (const guildId of keys.DEVELOPER_GUILD_IDS) {
  try {
    const startTime = performance.now();
    await rest.put(Routes.applicationGuildCommands(DISCORD_BOT_ID, guildId), { body: devCommandsArray });
    const endTime = performance.now();

    logger.info(`Registered ${devCommandsArray.length} application guild commands for ${guildId} in ${Math.floor(endTime - startTime)}ms`);
  } catch (err) {
    logger.error(err, `Failed to register guild commands for ${guildId}`);
  }
}

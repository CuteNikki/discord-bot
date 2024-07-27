import { REST, Routes } from 'discord.js';

import { readdir } from 'node:fs/promises';
import { performance } from 'perf_hooks';

import type { DiscordClient } from 'classes/client';
import { ModuleType, type Command } from 'classes/command';

import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

export async function loadCommands(client: DiscordClient) {
  const startTime = performance.now();

  const path = process.cwd() + '/src/commands/';
  const files = await readdir(path, { recursive: true });

  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;

    try {
      const imported: { default?: Command } = await import('file://' + path + file);
      if (!imported?.default?.options?.data?.name) continue;

      client.commands.set(imported.default.options.data.name, imported.default);
    } catch (error) {
      logger.error({ error}, `Error while loading command (${file})`);
      continue;
    }
  }

  const endTime = performance.now();
  logger.info(`[${client.cluster.id}] Loaded ${client.commands.size} commands in ${Math.floor(endTime - startTime)}ms`);
}

export async function registerCommands(client: DiscordClient) {
  const { DISCORD_BOT_ID, DISCORD_BOT_TOKEN } = keys;
  const rest = new REST().setToken(DISCORD_BOT_TOKEN);

  // Get each command's data
  const commands = client.commands.filter((cmd) => !cmd.options.isDeveloperOnly && cmd.options.module !== ModuleType.Developer).map((cmd) => cmd.options.data);
  const devCommands = client.commands
    .filter((cmd) => cmd.options.isDeveloperOnly || cmd.options.module === ModuleType.Developer)
    .map((cmd) => cmd.options.data);

  // Register global commands
  try {
    const startTime = performance.now();
    await rest.put(Routes.applicationCommands(DISCORD_BOT_ID), { body: commands });
    const endTime = performance.now();

    logger.info(`[${client.cluster.id}] Registered ${commands.length} application commands in ${Math.floor(endTime - startTime)}ms`);
  } catch (error) {
    logger.error({ error }, `[${client.cluster.id}] Failed to register application commands`);
  }

  // Register developer commands
  for (const guildId of keys.DEVELOPER_GUILD_IDS) {
    try {
      const startTime = performance.now();
      await rest.put(Routes.applicationGuildCommands(DISCORD_BOT_ID, guildId), { body: devCommands });
      const endTime = performance.now();

      logger.info(`[${client.cluster.id}] Registered ${devCommands.length} application guild commands for ${guildId} in ${Math.floor(endTime - startTime)}ms`);
    } catch (error) {
      logger.error({ error }, `[${client.cluster.id}] Failed to register application guild commands for ${guildId}`);
    }
  }
}

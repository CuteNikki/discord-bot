import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';

import type { DiscordClient } from 'classes/client';

import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

export async function loadCommands(client: DiscordClient) {
  const foldersPath = path.join(process.cwd(), 'src/commands');
  const folders = fs.readdirSync(foldersPath).filter((value) => !value.endsWith('.txt'));

  for (const folder of folders) {
    const commandsPath = path.join(foldersPath, folder);
    const files = fs.readdirSync(commandsPath).filter((value) => value.endsWith('.ts'));

    for (const file of files) {
      const filePath = path.join(commandsPath, file);
      const command = await import('file://' + filePath);

      if (!command.default) {
        logger.error(filePath, `Failed to load command`);
        continue;
      }

      client.commands.set(command.default.options.data.name, command.default);
    }
  }

  logger.info('Successfully loaded application commands');
}

export async function registerCommands(client: DiscordClient) {
  const { DISCORD_BOT_ID, DISCORD_BOT_TOKEN } = keys;
  const rest = new REST().setToken(DISCORD_BOT_TOKEN);

  const commands = client.commands.filter((cmd) => !cmd.options.developerOnly).map((cmd) => cmd.options.data);
  const devCommands = client.commands.filter((cmd) => cmd.options.developerOnly).map((cmd) => cmd.options.data);

  // Register global commands
  try {
    await rest.put(Routes.applicationCommands(DISCORD_BOT_ID), { body: commands });
    logger.info('Successfully registered application commands');
  } catch (err) {
    logger.error(err, `Failed to register application commands`);
  }

  // Register developer commands
  for (const guildId of keys.DEVELOPER_GUILD_IDS) {
    try {
      await rest.put(Routes.applicationGuildCommands(DISCORD_BOT_ID, guildId), { body: devCommands });
      logger.info(`Successfully registered application guild commands for ${guildId}`);
    } catch (err) {
      logger.error(err, `Failed to register application guild commands for ${guildId}`);
    }
  }
}

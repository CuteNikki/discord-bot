import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';

import type { DiscordClient } from 'classes/client';
import { logger } from 'utils/logger';

export async function loadCommands(client: DiscordClient) {
  const foldersPath = path.join(process.cwd(), 'src/commands');
  const folders = fs.readdirSync(foldersPath).filter((value) => !value.endsWith('.txt'));

  for (const folder of folders) {
    const commandsPath = path.join(foldersPath, folder);
    const files = fs.readdirSync(commandsPath).filter((value) => value.endsWith('.ts'));

    for (const file of files) {
      const filePath = path.join(commandsPath, file);
      const command = await import(filePath);

      if (!command.default) {
        logger.error('Failed to load command', filePath);
        continue;
      }

      client.commands.set(command.default.options.data.name, command.default);
    }
  }

  logger.info('Successfully loaded application commands');
}

export async function registerCommands(client: DiscordClient) {
  const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN!);
  const commands = client.commands.filter((cmd) => !cmd.options.developerOnly).map((cmd) => cmd.options.data);

  try {
    await rest.put(Routes.applicationCommands(process.env.DISCORD_BOT_ID!), { body: commands });
    logger.info('Successfully registered application commands');
  } catch (err) {
    logger.error('Failed to register application commands', err);
  }
}

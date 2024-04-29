import { Collection, Events } from 'discord.js';

import { DiscordClient } from 'classes/client';
import { logger } from 'utils/logger';

const client = new DiscordClient();

client.on(Events.InteractionCreate, (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      interaction.reply({ content: 'Could not find that command!', ephemeral: true });
      return;
    }
    if (command.options.developerOnly && interaction.user.id !== process.env.DISCORD_USER_ID) {
      interaction.reply({ content: 'This command cannot be used by you!', ephemeral: true });
      return;
    }

    const cooldowns = client.cooldowns;
    if (!cooldowns.has(command.options.data.name)) cooldowns.set(command.options.data.name, new Collection());

    const now = Date.now();
    const timestamps = cooldowns.get(command.options.data.name)!;
    const defaultCooldown = 3_000;
    const cooldownAmount = command.options.cooldown ?? defaultCooldown;
    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);
        interaction.reply({
          content: `Please wait, you are on a cooldown for \`${command.options.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
          ephemeral: true,
        });
        return;
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    try {
      command.options.execute({ client, interaction });
    } catch (err) {
      logger.error(`Could not run command ${command.options.data.name}`, err);
    }
  }
});

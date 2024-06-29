import { Collection, Events, type InteractionReplyOptions } from 'discord.js';
import i18next from 'i18next';

import { Modules } from 'classes/command';
import { Event } from 'classes/event';

import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

export default new Event({
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    // Since we only want the command interactions we return early if the interaction is not a command
    if (!interaction.isCommand() || !client.usable) return;

    const lng = await client.getLanguage(interaction.user.id);

    // Get the command with the interactions command name and return if it wasn't found
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    // Only allowing commands if their module is enabled
    if (interaction.guild) {
      const guildSettings = await client.getGuildSettings(interaction.guild.id);
      const message: InteractionReplyOptions = { content: i18next.t('interactions.module', { lng, module: command.options.module }), ephemeral: true };
      switch (command.options.module) {
        case Modules.MODERATION:
          if (!guildSettings.moderation.enabled) return interaction.reply(message);
          break;
        case Modules.LEVEL:
          if (!guildSettings.level.enabled) return interaction.reply(message);
          break;
        case Modules.MUSIC:
          if (!guildSettings.music.enabled) return interaction.reply(message);
          break;
      }
    }

    // Check if command is developer only and return if the user's id doesn't match the developer's id
    const developerIds = keys.DEVELOPER_USER_IDS;
    if (command.options.developerOnly && !developerIds.includes(interaction.user.id))
      return interaction.reply({ content: i18next.t('interactions.developer_only', { lng }), ephemeral: true });

    // Check if cooldowns has the current command and add the command if it doesn't have the command
    const cooldowns = client.cooldowns;
    if (!cooldowns.has(command.options.data.name)) cooldowns.set(command.options.data.name, new Collection());

    const now = Date.now(); // Current time (timestamp)
    const timestamps = cooldowns.get(command.options.data.name)!; // Get collection of <user id, last used timestamp>
    // Get the cooldown amount and setting it to 3 seconds if command does not have a cooldown
    const defaultCooldown = 3_000;
    const cooldownAmount = command.options.cooldown ?? defaultCooldown;

    // If the user is still on cooldown and they use the command again, we send them a message letting them know when the cooldown ends
    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;
      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);
        return interaction.reply({
          content: i18next.t('interactions.cooldown', { lng, action: `\`${command.options.data.name}\``, timestamp: `<t:${expiredTimestamp}:R>` }),
          ephemeral: true,
        });
      }
    }
    // Set the user id's last used timestamp to now
    timestamps.set(interaction.user.id, now);
    // Remove the user id's last used timestamp after the cooldown is over
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    // Try to run the command and send an error message if it couldn't run
    try {
      command.options.execute({ client, interaction });
    } catch (err: any) {
      const message = i18next.t('interactions.error', { lng, error: err.message });

      if (interaction.deferred) interaction.editReply({ content: message });
      else interaction.reply({ content: message, ephemeral: true });

      logger.error(err, message);
    }
  },
});

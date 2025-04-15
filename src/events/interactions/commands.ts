import { Collection, Colors, EmbedBuilder, Events, MessageFlags, time, TimestampStyles, type Interaction } from 'discord.js';

import { Event } from 'classes/event';

import { getBlacklist } from 'database/blacklist';

import logger from 'utility/logger';

export default new Event({
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction: Interaction) {
    if (!interaction.isCommand()) {
      return;
    }

    /**
     * Finding the command
     */

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      return;
    }

    /**
     * Handling blacklisted users
     */

    const blacklist = await getBlacklist(interaction.user.id);

    if (blacklist) {
      await interaction
        .reply({
          content: blacklist.expiresAt
            ? `You are blacklisted from using this bot until <t:${Math.floor(blacklist.expiresAt.getTime() / 1_000)}>!`
            : 'You are blacklisted from using this bot!',
          flags: [MessageFlags.Ephemeral],
        })
        .catch((err) => logger.debug({ err }, 'Error while replying to interaction'));
      return;
    }

    /**
     * Handling cooldowns
     */

    const cooldowns = client.cooldowns;
    if (!cooldowns.has(command.options.builder.name)) {
      cooldowns.set(command.options.builder.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.options.builder.name)!;
    const defaultCooldown = 3_000;
    const cooldownAmount = command.options.cooldown ?? defaultCooldown;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

      if (now <= expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Red)
              .setDescription(
                `Please wait, you are on cooldown for \`${command.options.builder.name}\`.\nYou can use it again ${time(expiredTimestamp, TimestampStyles.RelativeTime)}.`,
              ),
          ],
          flags: [MessageFlags.Ephemeral],
        });
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    /**
     * Executing the command
     */

    try {
      await command.options.execute(interaction);
    } catch (error) {
      logger.error(error);

      if (interaction.replied || interaction.deferred) {
        await interaction
          .followUp({ content: 'There was an error while executing this command!', flags: [MessageFlags.Ephemeral] })
          .catch((err) => logger.debug({ err }, 'Error while following up to interaction'));
      } else if (!interaction.replied && !interaction.deferred) {
        await interaction
          .reply({ content: 'There was an error while executing this command!', flags: [MessageFlags.Ephemeral] })
          .catch((err) => logger.debug({ err }, 'Error while replying to interaction'));
      }
    }
  },
});

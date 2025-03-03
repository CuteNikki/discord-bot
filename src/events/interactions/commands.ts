import { Collection, Colors, EmbedBuilder, Events, MessageFlags, time, TimestampStyles, type Interaction } from 'discord.js';

import { Event } from 'classes/event';

import { getBlacklist } from 'database/blacklist';

import logger from 'utility/logger';

export default new Event({
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction: Interaction) {
    logger.debug({ data: interaction }, 'Interaction received');
    if (!interaction.isCommand()) {
      logger.debug('Interaction is not a command');
      return;
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      logger.debug({ data: interaction.commandName }, 'Command not found');
      return;
    }

    const blacklist = await getBlacklist(interaction.user.id);
    if (blacklist) {
      logger.debug({ data: blacklist }, 'User is blacklisted');
      await interaction
        .reply({
          content: blacklist.expiresAt
            ? `You are blacklisted from using this bot until <t:${Math.floor(blacklist.expiresAt.getTime() / 1_000)}>!`
            : 'You are blacklisted from using this bot!',
          flags: [MessageFlags.Ephemeral],
        })
        .catch((e) => logger.debug({ err: e }, 'Error while replying to interaction'));
      return;
    }

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

    try {
      logger.debug({ data: command }, 'Executing command');
      await command.options.execute(interaction);
    } catch (error) {
      logger.error(error);

      if (interaction.replied) {
        await interaction
          .followUp({ content: 'There was an error while executing this command!', flags: [MessageFlags.Ephemeral] })
          .catch((e) => logger.debug({ err: e }, 'Error while following up to interaction'));
      } else {
        await interaction
          .reply({ content: 'There was an error while executing this command!', flags: [MessageFlags.Ephemeral] })
          .catch((e) => logger.debug({ err: e }, 'Error while replying to interaction'));
      }
    }
  },
});

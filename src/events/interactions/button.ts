import { Collection, Colors, EmbedBuilder, Events, MessageFlags } from 'discord.js';

import { Event } from 'classes/event';

import { getBlacklist } from 'database/blacklist';

import logger from 'utility/logger';

export default new Event({
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction) {
    if (!interaction.isButton()) return;

    /**
     * Finding the button
     */

    let button = client.buttons.get(interaction.customId);

    if (!button) {
      button = client.buttons.find((b) => b.options.includeCustomId && interaction.customId.includes(b.options.customId));
    }

    if (!button) {
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
        .catch((e) => console.error('Error while replying to interaction', e));
      return;
    }

    /**
     * Handling user permissions
     */

    if (interaction.inCachedGuild() && button.options.userPermissions) {
      const missingPermissions = interaction.member.permissions.missing(button.options.userPermissions);

      if (missingPermissions?.length) {
        await interaction
          .reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.Red)
                .setDescription(`You are missing the following permissions to execute this button: \`${missingPermissions.join(', ')}\``),
            ],
            flags: [MessageFlags.Ephemeral],
          })
          .catch((e) => console.error('Error while replying to interaction', e));
        return;
      }
    }

    /**
     * Handling cooldowns
     */

    const cooldowns = client.cooldowns;
    // Prefix: buttons and commands can have the same name/customId
    const buttonPrefix = 'btn_';
    const customId = buttonPrefix + button.options.customId;
    if (!cooldowns.has(customId)) {
      cooldowns.set(customId, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(customId)!;
    const defaultCooldown = 3_000;
    const cooldownAmount = button.options.cooldown ?? defaultCooldown;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

      if (now <= expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);
        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Red)
              .setDescription(
                `Please wait, you are on cooldown for \`${button.options.customId}\`.\nYou can use it again <t:${expiredTimestamp}:R>.`,
              ),
          ],
          flags: [MessageFlags.Ephemeral],
        });
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    /**
     * Handling bot permissions
     */

    if (interaction.inCachedGuild() && button.options.botPermissions) {
      const missingPermissions = interaction.guild.members.me?.permissions.missing(button.options.botPermissions);

      if (missingPermissions?.length) {
        await interaction
          .reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.Red)
                .setDescription(`I am missing the following permissions to execute this button: \`${missingPermissions.join(', ')}\``),
            ],
            flags: [MessageFlags.Ephemeral],
          })
          .catch((e) => console.error('Error while replying to interaction', e));
        return;
      }
    }

    /**
     * Executing the button
     */

    try {
      await button.options.execute(interaction);
    } catch (error) {
      logger.error(error);

      if (interaction.replied || interaction.deferred) {
        await interaction
          .editReply({
            content: '',
            components: [],
            files: [],
            embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription('An error occurred while executing the button.')],
          })
          .catch((e) => console.error('Error while editing reply to interaction', e));
      } else if (!interaction.replied && !interaction.deferred) {
        await interaction
          .reply({
            content: '',
            components: [],
            files: [],
            embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription('An error occurred while executing the button.')],
            flags: [MessageFlags.Ephemeral],
          })
          .catch((e) => console.error('Error while replying to interaction', e));
      }
    }
  },
});

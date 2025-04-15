import { Collection, Colors, EmbedBuilder, Events, MessageFlags } from 'discord.js';

import { Event } from 'classes/event';
import { getBlacklist } from 'database/blacklist';
import logger from 'utility/logger';

export default new Event({
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction) {
    if (!interaction.isSelectMenu()) return;

    /**
     * Finding the select menu
     */
    let selectMenu = client.selectMenus.get(interaction.customId);

    if (!selectMenu) {
      selectMenu = client.selectMenus.find((s) => s.options.includeCustomId && interaction.customId.includes(s.options.customId));
    }

    if (!selectMenu) {
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

    if (interaction.inCachedGuild() && selectMenu.options.userPermissions) {
      const missingPermissions = interaction.member.permissions.missing(selectMenu.options.userPermissions);
      if (missingPermissions?.length) {
        await interaction
          .reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.Red)
                .setDescription(
                  `You are missing the following permissions to execute this select menu: \`${missingPermissions.join(', ')}\``,
                ),
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
    const menuPrefix = 'smn_';
    const customId = menuPrefix + selectMenu.options.customId;
    if (!cooldowns.has(customId)) {
      cooldowns.set(customId, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(customId)!;
    const defaultCooldown = 3_000;
    const cooldownAmount = selectMenu.options.cooldown ?? defaultCooldown;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);
        await interaction
          .reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.Red)
                .setDescription(
                  `Please wait, you are on cooldown for \`${selectMenu.options.customId}\`.\nYou can use it again <t:${expiredTimestamp}:R>.`,
                ),
            ],
          })
          .catch((e) => console.error('Error while replying to interaction', e));
        return;
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    /**
     * Handling bot permissions
     */

    if (interaction.inCachedGuild() && selectMenu.options.botPermissions) {
      const missingPermissions = interaction.guild.members.me?.permissions.missing(selectMenu.options.botPermissions);
      if (missingPermissions?.length) {
        await interaction
          .reply({
            embeds: [
              new EmbedBuilder()
                .setColor(Colors.Red)
                .setDescription(`I am missing the following permissions to execute this select menu: \`${missingPermissions.join(', ')}\``),
            ],
            flags: [MessageFlags.Ephemeral],
          })
          .catch((e) => console.error('Error while replying to interaction', e));
        return;
      }
    }

    /**
     * Executing the select menu
     */

    try {
      await selectMenu.options.execute(interaction);
    } catch (error) {
      logger.error(error);

      if (interaction.replied || interaction.deferred) {
        await interaction
          .editReply({
            content: '',
            components: [],
            files: [],
            embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription('An error occurred while executing the select menu.')],
          })
          .catch((e) => console.error('Error while editing reply to interaction', e));
      } else if (!interaction.replied && !interaction.deferred) {
        await interaction
          .reply({
            content: '',
            components: [],
            files: [],
            embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription('An error occurred while executing the select menu.')],
            flags: [MessageFlags.Ephemeral],
          })
          .catch((e) => console.error('Error while replying to interaction', e));
      }
    }
  },
});

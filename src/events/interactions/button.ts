import { Collection, Events, PermissionsBitField } from 'discord.js';
import i18next from 'i18next';

import { type Button } from 'classes/button';
import { Event } from 'classes/event';

import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

export default new Event({
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    // Since we only want the button interactions we return early if the interaction is not a button
    if (!interaction.isButton() || !client.usable) return;

    const lng = await client.getLanguage(interaction.user.id);

    // Get the button with the interactions custom id and return if it wasn't found
    let button: Button | undefined;
    for (const key of client.buttons.keys()) {
      if (interaction.customId.includes(key)) {
        const tempButton = client.buttons.get(key)!;
        if (!tempButton.options.includesCustomId && key !== interaction.customId) {
          continue;
        } else {
          button = tempButton;
          break;
        }
      }
    }
    if (!button) return;

    // Check author only
    if (button.options.authorOnly) {
      const content = i18next.t('interactions.author_only', { lng });
      if (interaction.message.interaction && interaction.user.id !== interaction.message.interaction.user.id)
        return interaction.reply({ content, ephemeral: true });
      if (interaction.message.reference && interaction.user.id !== (await interaction.message.fetchReference()).author.id)
        return interaction.reply({ content, ephemeral: true });
    }

    // Permissions check
    if (button.options.permissions?.length) {
      if (!interaction.member) return interaction.reply({ content: i18next.t('interactions.guild_only', { lng }), ephemeral: true });
      const permissions = interaction.member.permissions as PermissionsBitField;
      if (!permissions.has(button.options.permissions)) return interaction.reply({ content: i18next.t('interactions.permissions', { lng }), ephemeral: true });
    }

    // Check if button is developer only and return if the user's id doesn't match the developer's id
    const developerIds = keys.DEVELOPER_USER_IDS;
    if (button.options.developerOnly && !developerIds.includes(interaction.user.id))
      return interaction.reply({ content: i18next.t('interactions.developer_only', { lng }), ephemeral: true });

    // Check if cooldowns has the current button and add the button if it doesn't have the button
    const cooldowns = client.cooldowns;
    if (!cooldowns.has(button.options.customId)) cooldowns.set(button.options.customId, new Collection());

    const now = Date.now(); // Current time (timestamp)
    const timestamps = cooldowns.get(button.options.customId)!; // Get collection of <user id, last used timestamp>
    // Get the cooldown amount and setting it to 3 seconds if button does not have a cooldown
    const defaultCooldown = 3_000;
    const cooldownAmount = button.options.cooldown ?? defaultCooldown;

    // If the user is still on cooldown and they use the button again, we send them a message letting them know when the cooldown ends
    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;
      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);
        return interaction.reply({
          content: i18next.t('interactions.cooldown', { lng, action: `\`${button.options.customId}\``, timestamp: `<t:${expiredTimestamp}:R>` }),
          ephemeral: true,
        });
      }
    }
    // Set the user id's last used timestamp to now
    timestamps.set(interaction.user.id, now);
    // Remove the user id's last used timestamp after the cooldown is over
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    // Try to run the button and send an error message if it couldn't run
    try {
      button.options.execute({ client, interaction });
    } catch (err: any) {
      const message = i18next.t('interactions.error', { lng, error: `\`${err.message}\`` });

      if (interaction.deferred) interaction.editReply({ content: message });
      else interaction.reply({ content: message, ephemeral: true });

      logger.error(err, message);
    }
  },
});

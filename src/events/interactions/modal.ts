import { Collection, Events, PermissionsBitField } from 'discord.js';

import { Event } from 'classes/event';
import type { Modal } from 'classes/modal';

import { keys } from 'utils/keys';
import { logger } from 'utils/logger';

export default new Event({
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    // Since we only want the button interactions we return early if the interaction is not a button
    if (!interaction.isModalSubmit() || !client.usable) return;

    // Get the button with the interactions custom id and return if it wasn't found
    let modal: Modal | undefined;
    for (const key of client.modals.keys()) {
      if (interaction.customId.includes(key)) {
        const tempModal = client.modals.get(key)!;
        if (!tempModal.options.includesCustomId && key !== interaction.customId) {
          continue;
        } else {
          modal = tempModal;
          break;
        }
      }
    }
    if (!modal) return;

    // Permissions check
    if (modal.options.permissions?.length) {
      if (!interaction.member) return interaction.reply({ content: 'This can only be done in a guild!', ephemeral: true });
      const permissions = interaction.member.permissions as PermissionsBitField;
      if (!permissions.has(modal.options.permissions)) return interaction.reply({ content: 'You are missing permissions!', ephemeral: true });
    }

    // Check if button is developer only and return if the user's id doesn't match the developer's id
    const developerIds = keys.DEVELOPER_USER_IDS;
    if (modal.options.developerOnly && !developerIds.includes(interaction.user.id))
      return interaction.reply({ content: 'This modal cannot be used by you!', ephemeral: true });

    // Check if cooldowns has the current button and add the button if it doesn't have the button
    const cooldowns = client.cooldowns;
    if (!cooldowns.has(modal.options.customId)) cooldowns.set(modal.options.customId, new Collection());

    const now = Date.now(); // Current time (timestamp)
    const timestamps = cooldowns.get(modal.options.customId)!; // Get collection of <user id, last used timestamp>
    // Get the cooldown amount and setting it to 3 seconds if button does not have a cooldown
    const defaultCooldown = 3_000;
    const cooldownAmount = modal.options.cooldown ?? defaultCooldown;

    // If the user is still on cooldown and they use the button again, we send them a message letting them know when the cooldown ends
    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;
      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);
        return interaction.reply({
          content: `Please wait, you are on a cooldown for \`${modal.options.customId}\`. You can use it again <t:${expiredTimestamp}:R>.`,
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
      modal.options.execute({ client, interaction });
    } catch (err) {
      const message = `Could not run modal \`${modal.options.customId}\``;

      if (interaction.deferred) interaction.editReply({ content: message });
      else interaction.reply({ content: message, ephemeral: true });

      logger.error(err, message);
    }
  },
});

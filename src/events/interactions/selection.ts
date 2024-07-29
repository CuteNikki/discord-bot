import { Collection, Events, PermissionsBitField } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';
import type { Selection } from 'classes/selection';

import { sendError } from 'utils/error';
import { keys } from 'utils/keys';

export default new Event({
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    // Since we only want the selection interactions we return early if the interaction is not a selection
    if (!interaction.isAnySelectMenu()) return;

    const lng = await client.getUserLanguage(interaction.user.id);

    // Get the selection with the interactions custom id and return if it wasn't found
    let selection: Selection | undefined;
    for (const key of client.selections.keys()) {
      if (interaction.customId.includes(key)) {
        const tempSelection = client.selections.get(key)!;
        if (!tempSelection.options.isCustomIdIncluded && key !== interaction.customId) {
          continue;
        } else {
          selection = tempSelection;
          break;
        }
      }
    }
    if (!selection) return;

    const user = await client.getUserData(interaction.user.id);
    if (user.banned) return;

    // Check author only
    if (selection.options.isAuthorOnly) {
      const content = t('interactions.author_only', { lng });
      if (interaction.message.interaction && interaction.user.id !== interaction.message.interaction.user.id)
        return interaction.reply({ content, ephemeral: true });
      if (interaction.message.reference && interaction.user.id !== (await interaction.message.fetchReference()).author.id)
        return interaction.reply({ content, ephemeral: true });
    }

    // Permissions check
    if (selection.options.permissions?.length) {
      if (!interaction.member)
        return interaction.reply({
          content: t('interactions.guild_only', { lng }),
          ephemeral: true,
        });
      const permissions = interaction.member.permissions as PermissionsBitField;
      if (!permissions.has(selection.options.permissions))
        return interaction.reply({
          content: t('interactions.permissions', { lng }),
          ephemeral: true,
        });
    }

    // Bot permissions check
    if (selection.options.botPermissions?.length && interaction.guild?.members.me) {
      const permissions = interaction.guild.members.me.permissions;
      if (!permissions.has(selection.options.botPermissions)) {
        return interaction.reply({
          content: t('interactions.bot_permissions', {
            lng,
            permissions: selection.options.botPermissions.join(', '),
          }),
          ephemeral: true,
        });
      }
    }

    // Check if selection is developer only and return if the user's id doesn't match the developer's id
    const developerIds = keys.DEVELOPER_USER_IDS;
    if (selection.options.isDeveloperOnly && !developerIds.includes(interaction.user.id))
      return interaction.reply({
        content: t('interactions.developer_only', { lng }),
        ephemeral: true,
      });

    // Check if cooldowns has the current selection and add the selection if it doesn't have the selection
    const cooldowns = client.cooldowns;
    if (!cooldowns.has(selection.options.customId)) cooldowns.set(selection.options.customId, new Collection());

    const now = Date.now(); // Current time (timestamp)
    const timestamps = cooldowns.get(selection.options.customId)!; // Get collection of <user id, last used timestamp>
    // Get the cooldown amount and setting it to 3 seconds if selection does not have a cooldown
    const defaultCooldown = 3_000;
    const cooldownAmount = selection.options.cooldown ?? defaultCooldown;

    // If the user is still on cooldown and they use the selection again, we send them a message letting them know when the cooldown ends
    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;
      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);
        return interaction.reply({
          content: t('interactions.cooldown', {
            lng,
            action: `\`${selection.options.customId}\``,
            timestamp: `<t:${expiredTimestamp}:R>`,
          }),
          ephemeral: true,
        });
      }
    }
    // Set the user id's last used timestamp to now
    timestamps.set(interaction.user.id, now);
    // Remove the user id's last used timestamp after the cooldown is over
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    // Try to run the selection and send an error message if it couldn't run
    try {
      selection.options.execute({ client, interaction });
    } catch (error: any) {
      const message = t('interactions.error', {
        lng,
        error: `\`${error.message}\``,
      });

      if (interaction.deferred) interaction.editReply({ content: message });
      else interaction.reply({ content: message, ephemeral: true });

      sendError({ client, error, location: 'Selection Interaction Error' });
    }
  },
});

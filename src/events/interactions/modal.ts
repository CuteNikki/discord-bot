import { Collection, EmbedBuilder, Events, PermissionsBitField } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getUserData } from 'db/user';

import { keys } from 'constants/keys';

import { sendError } from 'utils/error';
import { supportedLanguages } from 'utils/language';

// Collection of cooldowns so interactions cannot be spammed
// !! This should not be used for hourly or daily commands as it resets with each restart !!
const cooldowns = new Collection<string, Collection<string, number>>(); // Collection<customId/commandName, Collection<userId, lastUsedTimestamp>>

export default new Event({
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    // We only want to run this event for modals
    if (!interaction.isModalSubmit()) return;

    const { banned, language } = await getUserData(interaction.user.id);

    // If the user is banned, we don't want to continue
    if (banned) {
      return;
    }

    // getting the users language
    let lng = language;
    if (!lng) lng = supportedLanguages[0];

    let modal = client.modals.get(interaction.customId);

    /**
     * isCustomIdIncluded check
     */
    if (!modal) {
      for (const [, mdl] of client.modals) {
        if (!interaction.customId.includes(mdl.options.customId) || !mdl.options.isCustomIdIncluded) {
          continue;
        }

        modal = mdl;
        break;
      }
    }
    // If we don't have a modal, we don't want to continue
    if (!modal) {
      return;
    }

    /**
     * Member permissions check
     */
    if (modal.options.permissions?.length && interaction.member) {
      const permissions = interaction.member.permissions as PermissionsBitField;

      if (!permissions.has(modal.options.permissions)) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.error)
              .setDescription(t('interactions.permissions', { lng, permissions: modal.options.permissions.join(', ') }))
          ],
          ephemeral: true
        });
        return;
      }
    }

    /**
     * Bot permissions check
     */
    if (modal.options.botPermissions?.length && interaction.guild?.members.me) {
      const permissions = interaction.guild.members.me.permissions;

      if (!permissions.has(modal.options.botPermissions)) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.error)
              .setDescription(t('interactions.bot-permissions', { lng, permissions: modal.options.botPermissions.join(', ') }))
          ],
          ephemeral: true
        });
        return;
      }
    }

    /**
     * isDeveloperOnly check
     */
    if (modal.options.isDeveloperOnly && !keys.DEVELOPER_USER_IDS.includes(interaction.user.id))
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('interactions.developer-only', { lng }))],
        ephemeral: true
      });

    /**
     * Handling cooldowns
     */
    if (!cooldowns.has(modal.options.customId)) {
      cooldowns.set(modal.options.customId, new Collection());
    }

    const now = Date.now();
    // collection of <user id, last used timestamp>
    const timestamps = cooldowns.get(modal.options.customId)!;
    // the buttons cooldown or 3 seconds
    const cooldownAmount = modal.options.cooldown ?? 3_000;

    // if the user is still on cooldown
    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.error)
              .setDescription(t('interactions.cooldown', { lng, action: `\`${modal.options.customId}\``, timestamp: `<t:${expiredTimestamp}:R>` }))
          ],
          ephemeral: true
        });
        return;
      }
    }
    // Add the user to cooldowns
    timestamps.set(interaction.user.id, now);
    // Remove the user from cooldowns after the cooldown is over
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    /**
     * Running the modal
     */
    try {
      await modal.options.execute({ client, interaction, lng });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const embed = new EmbedBuilder().setColor(client.colors.error).setDescription(t('interactions.error', { lng, error: err.message }));

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await sendError({ client, err, location: `Modal Interaction Error: ${modal.options.customId}` });
    }
  }
});

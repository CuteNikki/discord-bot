import { Collection, EmbedBuilder, Events, inlineCode, PermissionsBitField, time, TimestampStyles } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { getUser } from 'db/user';

import { keys } from 'constants/keys';

import { sendError } from 'utils/error';
import { supportedLanguages } from 'utils/language';

// Collection of cooldowns so interactions cannot be spammed
// !! This should not be used for hourly or daily commands as it resets with each restart !!
const cooldowns = new Collection<string, Collection<string, number>>(); // Collection<customId/commandName, Collection<userId, lastUsedTimestamp>>

export default new Event({
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    // We only want to run this event for selections
    if (!interaction.isAnySelectMenu()) return;

    const { banned, language } = (await getUser(interaction.user.id)) ?? { banned: false, language: supportedLanguages[0] };

    // If the user is banned, we don't want to continue
    if (banned) {
      return;
    }

    // getting the users language
    let lng = language;
    if (!lng) lng = supportedLanguages[0];

    let selection = client.selections.get(interaction.customId);

    /**
     * isCustomIdIncluded check
     */
    if (!selection) {
      for (const [, sel] of client.selections) {
        if (!interaction.customId.includes(sel.options.customId) || !sel.options.isCustomIdIncluded) {
          continue;
        }

        selection = sel;
        break;
      }
    }
    // If we don't have a selection, we don't want to continue
    if (!selection) {
      return;
    }

    /**
     * Author only check
     */
    if (selection.options.isAuthorOnly) {
      if (
        (interaction.message.interactionMetadata && interaction.user.id !== interaction.message.interactionMetadata.user.id) ||
        (interaction.message.reference && interaction.user.id !== (await interaction.message.fetchReference())?.author.id)
      ) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('interactions.author-only', { lng }))],
          ephemeral: true
        });
        return;
      }
    }

    /**
     * Member permissions check
     */
    if (selection.options.permissions?.length && interaction.member) {
      const permissions = interaction.member.permissions as PermissionsBitField;

      if (!permissions.has(selection.options.permissions)) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.error)
              .setDescription(t('interactions.permissions', { lng, permissions: selection.options.permissions.join(', ') }))
          ],
          ephemeral: true
        });
        return;
      }
    }

    /**
     * Bot permissions check
     */
    if (selection.options.botPermissions?.length && interaction.guild?.members.me) {
      const permissions = interaction.guild.members.me.permissions;

      if (!permissions.has(selection.options.botPermissions)) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.error)
              .setDescription(t('interactions.bot-permissions', { lng, permissions: selection.options.botPermissions.join(', ') }))
          ],
          ephemeral: true
        });
        return;
      }
    }

    /**
     * isDeveloperOnly check
     */
    if (selection.options.isDeveloperOnly && !keys.DEVELOPER_USER_IDS.includes(interaction.user.id)) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('interactions.developer-only', { lng }))],
        ephemeral: true
      });
      return;
    }

    /**
     * Handling cooldowns
     */
    if (!cooldowns.has(selection.options.customId)) {
      cooldowns.set(selection.options.customId, new Collection());
    }

    const now = Date.now();
    // collection of <user id, last used timestamp>
    const timestamps = cooldowns.get(selection.options.customId)!;
    // the buttons cooldown or 3 seconds
    const cooldownAmount = selection.options.cooldown ?? 3_000;

    // if the user is still on cooldown
    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);

        await interaction.reply({
          embeds: [
            new EmbedBuilder().setColor(client.colors.error).setDescription(
              t('interactions.cooldown', {
                lng,
                action: inlineCode(selection.options.customId),
                timestamp: time(expiredTimestamp, TimestampStyles.RelativeTime)
              })
            )
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
     * Running the selection
     */
    try {
      await selection.options.execute({ client, interaction, lng });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const embed = new EmbedBuilder().setColor(client.colors.error).setDescription(t('interactions.error', { lng, error: err.message }));

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await sendError({ client, err, location: `Selection Interaction Error: ${selection.options.customId}` });
    }
  }
});

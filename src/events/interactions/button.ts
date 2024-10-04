import { Collection, EmbedBuilder, Events, PermissionsBitField } from 'discord.js';
import { t } from 'i18next';

import { Event } from 'classes/event';

import { incrementButtonsExecuted, incrementButtonsFailed } from 'db/client';
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
    // We only want to run this event for buttons
    if (!interaction.isButton()) {
      return;
    }

    const { banned, language } = await getUserData(interaction.user.id);

    // If the user is banned, we don't want to continue
    if (banned) {
      return;
    }

    // getting the users language
    let lng = language;
    if (!lng) lng = supportedLanguages[0];

    let button = client.buttons.get(interaction.customId);

    /**
     * isCustomIdIncluded check
     */
    if (!button) {
      for (const [, btn] of client.buttons) {
        if (!interaction.customId.includes(btn.options.customId) || !btn.options.isCustomIdIncluded) {
          continue;
        }

        button = btn;
        break;
      }
    }
    // If we don't have a button, we don't want to continue
    if (!button) {
      return;
    }

    /**
     * Author only check
     */
    if (button.options.isAuthorOnly) {
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
    if (button.options.permissions?.length && interaction.member) {
      const permissions = interaction.member.permissions as PermissionsBitField;

      if (!permissions.has(button.options.permissions)) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.error)
              .setDescription(t('interactions.permissions', { lng, permissions: button.options.permissions.join(', ') }))
          ],
          ephemeral: true
        });
        return;
      }
    }

    /**
     * Bot permissions check
     */
    if (button.options.botPermissions?.length && interaction.guild?.members?.me) {
      const permissions = interaction.guild.members.me.permissions;

      if (!permissions.has(button.options.botPermissions)) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder().setColor(client.colors.error).setDescription(
              t('interactions.bot-permissions', {
                lng,
                permissions: button.options.botPermissions.join(', ')
              })
            )
          ],
          ephemeral: true
        });
        return;
      }
    }

    /**
     * isDeveloperOnly check
     */
    if (button.options.isDeveloperOnly && !keys.DEVELOPER_USER_IDS.includes(interaction.user.id)) {
      await interaction.reply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('interactions.developer-only', { lng }))],
        ephemeral: true
      });
      return;
    }

    /**
     * Handling cooldowns
     */
    if (!cooldowns.has(button.options.customId)) {
      cooldowns.set(button.options.customId, new Collection());
    }

    const now = Date.now();
    // collection of <user id, last used timestamp>
    const timestamps = cooldowns.get(button.options.customId)!;
    // the buttons cooldown or 3 seconds
    const cooldownAmount = button.options.cooldown ?? 3_000;

    // if the user is still on cooldown
    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1_000);

        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.colors.error)
              .setDescription(t('interactions.cooldown', { lng, action: `\`${button.options.customId}\``, timestamp: `<t:${expiredTimestamp}:R>` }))
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
     * Running the button
     */
    try {
      await button.options.execute({ client, interaction, lng });
      await incrementButtonsExecuted(keys.DISCORD_BOT_ID);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const embed = new EmbedBuilder().setColor(client.colors.error).setDescription(t('interactions.error', { lng, error: err.message }));

      if (interaction.deferred) {
        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await sendError({ client, err, location: `Button Interaction Error: ${button.options.customId}` });
      await incrementButtonsFailed(keys.DISCORD_BOT_ID);
    }
  }
});

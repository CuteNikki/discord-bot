import {
  ApplicationIntegrationType,
  Colors, // All of default discord colors.
  EmbedBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ColorResolvable
} from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';

import { logger } from 'utils/logger';

export default new Command({
  // The module this command belongs to.
  // It categorizes commands in the commands list.
  module: ModuleType.General,
  // 1 second cooldown between command uses.
  cooldown: 1_000,
  // Only developers can use this command.
  isDeveloperOnly: false,
  // The bot needs to have this permission to be able to use this command.
  botPermissions: ['SendMessages'],
  // The slash command data.
  data: new SlashCommandBuilder()
    .setName('preview-color')
    .setDescription('Sends an embed with a color to preview')
    // Allowing the command to be used in guilds, DMs and private channels.
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    // Allowing the command to be used in guilds, DMs and private channels.
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    // By default only users with the manage messages permission can see and use this command.
    // UNLESS it was changed in the server settings under the integrations tab (per user or role).
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    // Adding options
    .addStringOption(
      (option) =>
        option
          .setName('color')
          .setDescription('The color to preview')
          .setRequired(true) // Makes the option required.
          .setAutocomplete(true) // Enable autocompletion.
    ),
  // On input, the autocomplete function is called.
  async autocomplete({ interaction }) {
    // This gets us whatever the user has typed.
    const input = interaction.options.getFocused();

    const colors = [
      { name: 'white', value: Colors.White.toString(16) },
      { name: 'aqua', value: Colors.Aqua.toString(16) },
      { name: 'green', value: Colors.Green.toString(16) },
      { name: 'blue', value: Colors.Blue.toString(16) },
      { name: 'yellow', value: Colors.Yellow.toString(16) },
      { name: 'purple', value: Colors.Purple.toString(16) },
      { name: 'luminous-vivid-pink', value: Colors.LuminousVividPink.toString(16) },
      { name: 'fuchsia', value: Colors.Fuchsia.toString(16) },
      { name: 'gold', value: Colors.Gold.toString(16) },
      { name: 'orange', value: Colors.Orange.toString(16) },
      { name: 'red', value: Colors.Red.toString(16) },
      { name: 'grey', value: Colors.Grey.toString(16) },
      { name: 'navy', value: Colors.Navy.toString(16) },
      { name: 'dark-aqua', value: Colors.DarkAqua.toString(16) },
      { name: 'dark-green', value: Colors.DarkGreen.toString(16) },
      { name: 'dark-blue', value: Colors.DarkBlue.toString(16) },
      { name: 'dark-purple', value: Colors.DarkPurple.toString(16) },
      { name: 'dark-vivid-pink', value: Colors.DarkVividPink.toString(16) },
      { name: 'dark-gold', value: Colors.DarkGold.toString(16) },
      { name: 'dark-orange', value: Colors.DarkOrange.toString(16) },
      { name: 'dark-red', value: Colors.DarkRed.toString(16) },
      { name: 'dark-grey', value: Colors.DarkGrey.toString(16) },
      { name: 'darker-grey', value: Colors.DarkerGrey.toString(16) },
      { name: 'light-grey', value: Colors.LightGrey.toString(16) },
      { name: 'dark-navy', value: Colors.DarkNavy.toString(16) },
      { name: 'blurple', value: Colors.Blurple.toString(16) },
      { name: 'greyple', value: Colors.Greyple.toString(16) },
      { name: 'dark-but-not-black', value: Colors.DarkButNotBlack.toString(16) },
      { name: 'not-quite-black', value: Colors.NotQuiteBlack.toString(16) }
    ];

    // If the input is empty, return all colors but limit to 25!
    // Discord API only allows for a max of 25 choices.
    if (!input.length) {
      await interaction.respond(colors.slice(0, 25));
      return;
    }

    await interaction.respond(
      colors
        // Filter the colors to only respond with the ones that match the input.
        .filter((color) => color.name.toLowerCase().includes(input.toLowerCase()))
        // Again, making sure we only ever return max of 25 results.
        .slice(0, 25)
    );
  },
  // On command, the execute function is called.
  // order of interaction, client and lng does not matter.
  async execute({ interaction, lng }) {
    // get a guilds language:
    // import { getGuildLanguage } from 'db/language';
    // const guildLng = await getGuildLanguage(guildId);

    // get a different users language:
    // import { getUserLanguage } from 'db/language';
    // const otherLng = await getUserLanguage(userId);

    // get the color the user provided
    const color = interaction.options.getString('color', true);

    // Autocomplete allows you to give the user a list to choose from,
    // but they will still be able to type in whatever they want!
    // it's a must to check if they actually provided a valid color.

    try {
      // Send the embed with the color preview if the color is valid.
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            // We get a type error here without the casting.
            .setColor(color as ColorResolvable)
            .setDescription(t('preview-color.preview', { lng, color }))
        ]
      });
    } catch (err) {
      // This block runs if an invalid color is provided.

      logger.debug({ err }, 'Error while previewing color');

      // In case something else went wrong and the reply was actually sent, edit it.
      if (!interaction.replied) {
        await interaction.reply({ content: t('preview-color.invalid', { lng }), ephemeral: true });
      } else {
        await interaction.editReply({ content: t('preview-color.invalid', { lng }) });
      }
    }
  }
});

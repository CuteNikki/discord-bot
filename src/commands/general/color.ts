import { Colors, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, type ColorResolvable } from 'discord.js';
import { t } from 'i18next';

import { Command, ModuleType } from 'classes/command';
import { logger } from 'utils/logger';

export default new Command({
  module: ModuleType.General,
  cooldown: 1_000, // 1 second cooldown between command uses
  isDeveloperOnly: false, // only developers can use this command
  botPermissions: ['SendMessages'], // the bot needs to have this permission to be able to use this command
  data: new SlashCommandBuilder()
    .setName('preview-color') // command name
    .setDescription('Sends an embed with a color to preview') // command description
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages) // only users with the manage messages permission can see and use this command
    .addStringOption(
      (option) =>
        option
          .setName('color') // option name
          .setDescription('The color to preview') // option description
          .setRequired(true) // makes the option required
          .setAutocomplete(true), // enables autocompletion
    ),
  async autocomplete({ interaction, client }) {
    // This gets us whatever the user has typed in the autocomplete
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
      { name: 'not-quite-black', value: Colors.NotQuiteBlack.toString(16) },
    ];
    // Making sure we only return 25 results as that is the max amount allowed by discord
    if (!input.length) return await interaction.respond(colors.slice(0, 25));
    await interaction.respond(colors.filter((color) => color.name.toLowerCase().includes(input.toLowerCase())).slice(0, 25));
  },
  // the order of client and interaction does not matter
  async execute({ interaction, client }) {
    const color = interaction.options.getString('color', true);

    const lng = await client.getUserLanguage(interaction.user.id);

    // Autocomplete allows you to give the user a list to choose from but they will still be able to type in whatever they want!
    // It's a must to check if they actually provided a valid color.
    try {
      await interaction.reply({ embeds: [new EmbedBuilder().setColor(color as ColorResolvable).setDescription(t('preview-color.preview', { lng, color }))] });
    } catch (err) {
      logger.debug({ err }, 'Error while previewing color');
      if (!interaction.replied) await interaction.reply({ content: t('preview-color.invalid', { lng }) });
      else await interaction.editReply({ content: t('preview-color.invalid', { lng }) });
    }
  },
});

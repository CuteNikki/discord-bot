import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';

import { Command } from 'classes/command';

export default new Command({
  builder: new SlashCommandBuilder()
    .setName('test')
    .setDescription('Test command')
    .addSubcommandGroup((group) =>
      group
        .setName('group')
        .setDescription('Test group')
        .addSubcommand((sub) =>
          sub
            .setName('sub')
            .setDescription('Test subcommand')
            .addStringOption((option) =>
              option.setName('string-option').setDescription('Test string option').setChoices({ name: 'choice 1', value: 'test_1' }),
            ),
        ),
    ),
  execute(interaction) {
    interaction.reply({
      content: 'Test command executed',
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('test')
            .setLabel('Test Button')
            .setStyle(ButtonStyle.Primary)
            .setEmoji({ name: '✅' })
            .setDisabled(false),
          new ButtonBuilder()
            .setCustomId('modal')
            .setLabel('Test Modal')
            .setStyle(ButtonStyle.Primary)
            .setEmoji({ name: '📝' })
            .setDisabled(false),
        ),
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('select')
            .setPlaceholder('Test Select Menu')
            .addOptions(
              new StringSelectMenuOptionBuilder()
                .setLabel('Test Option 1')
                .setValue('test_option_1')
                .setDescription('This is a test option')
                .setEmoji({ name: '✅' }),
              new StringSelectMenuOptionBuilder()
                .setLabel('Test Option 2')
                .setValue('test_option_2')
                .setDescription('This is another test option')
                .setEmoji({ name: '📝' }),
            ),
        ),
      ],
    });
  },
});

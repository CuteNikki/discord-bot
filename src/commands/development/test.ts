import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';

import { Command } from 'classes/command';

export default new Command({
  builder: new SlashCommandBuilder().setName('test').setDescription('Test command'),
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
        ),
      ],
    });
  },
});

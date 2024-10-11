import { exec } from 'child_process';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder, codeBlock } from 'discord.js';
import { inspect, promisify } from 'util';

import { Modal } from 'classes/modal';

import { logger } from 'utils/logger';

import { ModuleType } from 'types/interactions';

export default new Modal({
  module: ModuleType.Developer,
  customId: 'modal-execute',
  isCustomIdIncluded: false,
  isDeveloperOnly: true,
  permissions: ['Administrator'],
  botPermissions: ['SendMessages'],
  cooldown: 0,
  async execute({ interaction }) {
    await interaction.deferReply();

    const command = interaction.fields
      .getTextInputValue('command')
      .replaceAll('config', 'no')
      .replaceAll('env', 'no')
      .replaceAll('token', 'no')
      .replaceAll('TOKEN', 'no');
    const input = command.length > 4000 ? command.substring(0, 4000) + '...' : command;

    try {
      const execute = promisify(exec);
      const { stdout, stderr } = await execute(command);

      if (stderr) {
        let error = inspect(stderr, { depth: 0 })
          .replaceAll(interaction.client.token, 'no')
          .replaceAll(interaction.client.token.split('').reverse().join(''), 'no')
          .replaceAll('\\n', '\n');
        error = error.length > 4000 ? error.substring(0, 4000) + '...' : error;

        await interaction.editReply({
          embeds: [new EmbedBuilder().setTitle('Error').setColor(Colors.Red).setDescription(codeBlock('js', error))]
        });
        return;
      }

      let output = stdout
        .replaceAll(interaction.client.token, 'no')
        .replaceAll(interaction.client.token.split('').reverse().join(''), 'no')
        .replaceAll('\\n', '\n');
      output = output.length > 4000 ? output.substring(0, 4000) + '...' : output;

      return interaction.editReply({
        embeds: [
          new EmbedBuilder().setTitle('Input').setColor(Colors.Blurple).setDescription(codeBlock('js', input)),
          new EmbedBuilder().setTitle('Output').setColor(Colors.Green).setDescription(codeBlock('js', output))
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('button-execute-edit').setLabel('Edit').setStyle(ButtonStyle.Primary)
          )
        ]
      });
    } catch (err: unknown) {
      logger.debug({ err }, 'Execute Error');

      let error = inspect(err, { depth: 2 })
        .replaceAll(interaction.client.token, 'no')
        .replaceAll(interaction.client.token.split('').reverse().join(''), 'no')
        .replaceAll('\\n', '\n');
      error = error.length > 4000 ? error.substring(0, 4000) + '...' : error;

      return interaction.editReply({
        embeds: [
          new EmbedBuilder().setTitle('Input').setColor(Colors.Blurple).setDescription(codeBlock('js', input)),
          new EmbedBuilder().setTitle('Error').setColor(Colors.Red).setDescription(codeBlock('js', error))
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('button-execute-edit').setLabel('Edit').setStyle(ButtonStyle.Primary)
          )
        ]
      });
    }
  }
});

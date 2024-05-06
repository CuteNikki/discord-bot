import { inspect } from 'bun';
import { exec } from 'child_process';
import { Colors, EmbedBuilder, codeBlock } from 'discord.js';
import { promisify } from 'util';

import { Modal } from 'classes/modal';

export default new Modal({
  customId: 'modal_execute',
  includesCustomId: false,
  developerOnly: true,
  permissions: ['Administrator'],
  cooldown: 0,
  async execute({ interaction }) {
    await interaction.deferReply();

    const command = interaction.fields
      .getTextInputValue('command')
      .replaceAll('config', 'no')
      .replaceAll('env', 'no')
      .replaceAll(' token', 'no')
      .replaceAll('TOKEN', 'no');

    try {
      const execute = promisify(exec);
      const { stdout, stderr } = await execute(command);

      if (stderr)
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('Error')
              .setColor(Colors.Red)
              .setDescription(
                codeBlock(
                  'ts',
                  inspect(stderr, { depth: 0 })
                    .replaceAll(interaction.client.token, 'no')
                    .replaceAll(interaction.client.token.split('').reverse().join(''), 'no')
                    .replaceAll('\\n', '\n')
                    .substring(0, 4000)
                )
              ),
          ],
        });

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Input')
            .setColor(Colors.Blurple)
            .setDescription(codeBlock('ts', command.substring(0, 4000))),
          new EmbedBuilder()
            .setTitle('Output')
            .setColor(Colors.Green)
            .setDescription(
              codeBlock(
                'ts',
                stdout
                  .replaceAll(interaction.client.token, 'no')
                  .replaceAll(interaction.client.token.split('').reverse().join(''), 'no')
                  .replaceAll('\\n', '\n')
                  .substring(0, 4000)
              )
            ),
        ],
      });
    } catch (err) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Input')
            .setColor(Colors.Blurple)
            .setDescription(codeBlock('ts', command.substring(0, 4000))),
          new EmbedBuilder()
            .setTitle('Error')
            .setColor(Colors.Red)
            .setDescription(
              codeBlock(
                'ts',
                inspect(err, { depth: 0 })
                  .replaceAll(interaction.client.token, 'no')
                  .replaceAll(interaction.client.token.split('').reverse().join(''), 'no')
                  .replaceAll('\\n', '\n')
                  .substring(0, 4000)
              )
            ),
        ],
      });
    }
  },
});

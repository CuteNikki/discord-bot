import { inspect } from 'bun';

import { Modal } from 'classes/modal';
import { Colors, EmbedBuilder, codeBlock } from 'discord.js';

export default new Modal({
  customId: 'modal_eval',
  includesCustomId: false,
  developerOnly: true,
  permissions: ['Administrator'],
  cooldown: 0,
  async execute({ interaction, client }) {
    await interaction.deferReply();
    const { fields } = interaction;

    try {
      let output: string = await new Promise((resolve) => resolve(eval(fields.getTextInputValue('code').replaceAll('token', 'no').replaceAll('TOKEN', 'no'))));
      if (typeof output !== 'string') output = inspect(output, { depth: 1 });

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Output')
            .setColor(Colors.Green)
            .setDescription(
              codeBlock(
                'ts',
                output
                  .replaceAll(interaction.client.token, 'no')
                  .replaceAll(interaction.client.token.split('').reverse().join(''), 'no')
                  .replaceAll('\\n', '\n')
                  .substring(0, 3900)
              )
            ),
        ],
      });
    } catch (err) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Error')
            .setColor(Colors.Red)
            .setDescription(
              codeBlock(
                'ts',
                inspect(err, { depth: 1 })
                  .replaceAll(interaction.client.token, 'no')
                  .replaceAll(interaction.client.token.split('').reverse().join(''), 'no')
                  .replaceAll('\\n', '\n')
                  .substring(0, 3900)
              )
            ),
        ],
      });
    }
  },
});

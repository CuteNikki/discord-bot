import { Colors, EmbedBuilder, codeBlock } from 'discord.js';
import { inspect } from 'util';

import { Modal } from 'classes/modal';

export default new Modal({
  customId: 'modal_eval',
  isCustomIdIncluded: false,
  isDeveloperOnly: true,
  permissions: ['Administrator'],
  cooldown: 0,
  async execute({ interaction, client }) {
    await interaction.deferReply();
    const { fields } = interaction;

    const code = fields.getTextInputValue('code');
    const userDepth = fields.getTextInputValue('depth');
    const depth = parseInt(userDepth);

    try {
      let output: string = await new Promise((resolve) => resolve(eval(code)));
      if (typeof output !== 'string') output = inspect(output, { depth });

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Input')
            .setColor(Colors.Blurple)
            .setDescription(codeBlock('ts', code.substring(0, 4000))),
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
            .setDescription(codeBlock('ts', code.substring(0, 4000))),
          new EmbedBuilder()
            .setTitle('Error')
            .setColor(Colors.Red)
            .setDescription(
              codeBlock(
                'ts',
                inspect(err, { depth })
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

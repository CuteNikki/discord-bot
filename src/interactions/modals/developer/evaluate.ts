import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, codeBlock } from 'discord.js';
import { inspect } from 'util';

import { Modal } from 'classes/modal';

import { logger } from 'utils/logger';

export default new Modal({
  customId: 'modal-eval',
  isCustomIdIncluded: false,
  isDeveloperOnly: true,
  permissions: ['Administrator'],
  botPermissions: ['SendMessages'],
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
            .setColor(client.colors.developer)
            .setDescription(codeBlock('js', code.substring(0, 4000))),
          new EmbedBuilder()
            .setTitle('Output')
            .setColor(client.colors.success)
            .setDescription(
              codeBlock(
                'js',
                output
                  .replaceAll(interaction.client.token, 'no')
                  .replaceAll(interaction.client.token.split('').reverse().join(''), 'no')
                  .replaceAll('\\n', '\n')
                  .substring(0, 4000)
              )
            )
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('button-eval-edit').setLabel('Edit').setStyle(ButtonStyle.Primary)
          )
        ]
      });
    } catch (err: unknown) {
      logger.error({ err }, 'Eval Error');

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Input')
            .setColor(client.colors.developer)
            .setDescription(codeBlock('js', code.substring(0, 4000))),
          new EmbedBuilder()
            .setTitle('Error')
            .setColor(client.colors.error)
            .setDescription(
              codeBlock(
                'js',
                inspect(err, { depth })
                  .replaceAll(interaction.client.token, 'no')
                  .replaceAll(interaction.client.token.split('').reverse().join(''), 'no')
                  .replaceAll('\\n', '\n')
                  .substring(0, 4000)
              )
            )
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('button-eval-edit').setLabel('Edit').setStyle(ButtonStyle.Primary)
          )
        ]
      });
    }
  }
});

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

    let code = interaction.fields.getTextInputValue('code');
    code = code.length > 4000 ? code.substring(0, 4000) + '...' : code;

    const depth = parseInt(interaction.fields.getTextInputValue('depth'));

    try {
      let output: string = await new Promise((resolve) => resolve(eval(code)));

      if (typeof output !== 'string') {
        output = inspect(output, { depth }).replaceAll(interaction.client.token, 'no').replaceAll('\\n', '\n');
      }

      output = output.length > 4000 ? output.substring(0, 4000) + '...' : output;

      await interaction.editReply({
        embeds: [
          new EmbedBuilder().setTitle('Input').setColor(client.colors.developer).setDescription(codeBlock('js', code)),
          new EmbedBuilder().setTitle('Output').setColor(client.colors.success).setDescription(codeBlock('js', output))
        ],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('button-eval-edit').setLabel('Edit').setStyle(ButtonStyle.Primary)
          )
        ]
      });
    } catch (err: unknown) {
      logger.error({ err }, 'Eval Error');

      let error = inspect(err, { depth: 2 })
        .replaceAll(interaction.client.token, 'no')
        .replaceAll(interaction.client.token.split('').reverse().join(''), 'no')
        .replaceAll('\\n', '\n');
      error = error.length > 4000 ? error.substring(0, 4000) + '...' : error;

      await interaction.editReply({
        embeds: [
          new EmbedBuilder().setTitle('Input').setColor(client.colors.developer).setDescription(codeBlock('js', code)),
          new EmbedBuilder().setTitle('Error').setColor(client.colors.error).setDescription(codeBlock('js', error))
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

import { Colors, EmbedBuilder, codeBlock } from 'discord.js';
import i18next from 'i18next';
import { evaluate, format } from 'mathjs';

import { Modal } from 'classes/modal';

export default new Modal({
  customId: 'modal_math',
  async execute({ interaction, client }) {
    await interaction.deferReply();
    const lng = await client.getLanguage(interaction.user.id);

    const input = interaction.fields.getTextInputValue('expression');

    try {
      const output = evaluate(input);

      interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Aqua)
            .setTitle(i18next.t('math.title', { lng }))
            .setURL('https://mathjs.org/docs/expressions/syntax.html')
            .setFields(
              { name: i18next.t('math.input', { lng }), value: codeBlock('js', input) },
              { name: i18next.t('math.output', { lng }), value: codeBlock('js', format(output, { precision: 14 })) }
            ),
        ],
      });
    } catch (err: any) {
      interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Red)
            .setTitle(i18next.t('math.title_error', { lng }))
            .addFields(
              { name: i18next.t('math.input', { lng }), value: codeBlock('js', input) },
              { name: i18next.t('math.output', { lng }), value: codeBlock('js', err.message) }
            ),
        ],
      });
    }
  },
});

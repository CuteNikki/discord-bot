import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

import { Button } from 'classes/button';

import { addParticipant, findGiveawayByMessage } from 'db/giveaway';

import { logger } from 'utils/logger';

export default new Button({
  customId: 'button-giveaway-join',
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const giveaway = await findGiveawayByMessage(interaction.message.id);

    if (!giveaway) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('That giveaway could not be found. It might have ended already!')]
      });
      return;
    }

    if (giveaway.endsAt < Date.now()) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('That giveaway has ended already!')] });
      return;
    }

    if (giveaway.participants.includes(interaction.user.id)) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('You already joined that giveaway!')],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(`button-giveaway-leave_${giveaway._id.toString()}`).setLabel('Leave').setStyle(ButtonStyle.Danger)
          )
        ]
      });
      return;
    }

    await addParticipant(giveaway._id, interaction.user.id);
    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor(client.colors.giveaway).setDescription('You joined that giveaway!')]
    });

    await interaction.message
      .edit({
        embeds: [
          EmbedBuilder.from(interaction.message.embeds[0]).setFields(
            ...interaction.message.embeds[0].fields.slice(0, 3).map((field) => ({ name: field.name, value: field.value, inline: field.inline ? true : false })),
            {
              name: 'Participants',
              value: (giveaway.participants.length + 1).toString()
            }
          )
        ]
      })
      .catch((err) => logger.debug({ err }, 'Could not edit giveaway message'));
  }
});

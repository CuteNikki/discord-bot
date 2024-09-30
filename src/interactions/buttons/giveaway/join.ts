import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

import { Button } from 'classes/button';

import { addParticipant, findGiveawayByMessage } from 'db/giveaway';

export default new Button({
  customId: 'button-giveaway-join',
  async execute({ interaction, client }) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ ephemeral: true });

    const giveaway = await findGiveawayByMessage(interaction.message.id);

    if (!giveaway) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('This giveaway no longer exist!')] });
      return;
    }

    if (giveaway.endsAt < Date.now()) {
      await interaction.editReply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('This giveaway has ended!')] });
      return;
    }

    if (giveaway.participants.includes(interaction.user.id)) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription('You have already joined this giveaway!')],
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
      embeds: [new EmbedBuilder().setColor(client.colors.giveaway).setDescription('You have joined this giveaway!')]
    });
  }
});

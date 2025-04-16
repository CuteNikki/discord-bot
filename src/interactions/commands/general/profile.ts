import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import { Command } from 'classes/command';
import { ProfileBuilder } from 'classes/profile-builder';

export default new Command({
  builder: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Shows a profile')
    .addUserOption((option) => option.setName('user').setDescription('The user to show the profile of').setRequired(false)),
  async execute(interaction) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

    let user = interaction.options.getUser('user') || interaction.user;
    user = await interaction.client.users.fetch(user.id, { force: true }).catch(() => user);

    if (!interaction.channel?.isSendable()) return;

    const profileCard = new ProfileBuilder()
      .setDisplayName(user.displayName)
      .setUsername(user.username)
      .setAvatarURL(user.displayAvatarURL({ extension: 'png', size: 256 }))
      .setBannerURL(user.bannerURL({ extension: 'png', size: 512 }) ?? undefined);
    interaction.editReply({ files: [await profileCard.build()] });
  },
});

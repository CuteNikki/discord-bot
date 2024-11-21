import { EmbedBuilder } from 'discord.js';
import { t } from 'i18next';

import { Button } from 'classes/button';

import { getUser } from 'db/user';

import { ModuleType } from 'types/interactions';

export default new Button({
  module: ModuleType.Economy,
  customId: 'button-balance-refresh',
  isCustomIdIncluded: true,
  async execute({ client, interaction, lng }) {
    const userId = interaction.customId.split('_')[1];
    const user = await client.users.fetch(userId).catch(() => {});

    const userData = (await getUser(userId)) ?? { bank: 0, wallet: 0 };

    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setColor(client.colors.economy)
          .setAuthor({ name: t('balance.title', { lng, user: user?.displayName }), iconURL: user?.displayAvatarURL() })
          .addFields(
            {
              name: t('balance.bank', { lng }),
              value: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(userData.bank)
            },
            {
              name: t('balance.wallet', { lng }),
              value: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(userData.wallet)
            }
          )
      ]
    });
  }
});

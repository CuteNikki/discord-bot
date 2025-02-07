import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder, time, TimestampStyles } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { addItems, addMoney, getUser, hasWorked, removeItem } from 'db/user';

import { getRandomNumber } from 'utils/common';

import { boot, diamond, fish, rock, scrap, wood } from 'constants/items';

import { ModuleType } from 'types/interactions';
import { ItemType } from 'types/user';

const BREAK_CHANCE = 5;
const DEATH_CHANCE = 10;

export default new Command({
  module: ModuleType.Economy,
  cooldown: 0, // We have another cooldown for work, which is stored in the database
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work to earn money and items')
    .setContexts(InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addStringOption((option) =>
      option
        .setName('action')
        .setDescription('The action you want to do')
        .setRequired(true)
        .setChoices([
          { name: 'mine', value: 'mine' },
          { name: 'fish', value: 'fish' },
          { name: 'lumber', value: 'lumber' },
          { name: 'fight', value: 'fight' }
        ])
    ),
  async execute({ client, interaction, lng }) {
    const action = interaction.options.getString('action', true);

    const userData = await getUser(interaction.user.id);

    const cooldown = 1000 * 60 * 60;

    const now = Date.now();

    const timeLeft = (userData?.lastWork ?? 0) + cooldown - now;

    if (timeLeft > 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.colors.error)
            .setDescription(t('work.cooldown', { lng, left: time(Math.floor((now + timeLeft) / 1000), TimestampStyles.RelativeTime) }))
        ],
        flags: [MessageFlags.Ephemeral]
      });
    }

    await hasWorked(interaction.user.id, now);

    switch (action) {
      case 'mine':
        {
          if (!userData?.inventory.find((item) => item.id === ItemType.Pickaxe)) {
            return interaction.reply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('work.no-pickaxe', { lng }))],
              flags: [MessageFlags.Ephemeral]
            });
          }

          const randomRocks = getRandomNumber(2, 5);
          const items = new Array(randomRocks).fill(rock);

          const foundDiamond = getRandomNumber(1, 100) <= BREAK_CHANCE;

          if (foundDiamond) {
            items.push(diamond);
            await removeItem(interaction.user.id, ItemType.Pickaxe);
          }

          await addItems(interaction.user.id, items);

          const randomMoney = getRandomNumber(100, 500);
          await addMoney(interaction.user.id, randomMoney);

          interaction.reply({
            embeds: [
              new EmbedBuilder().setColor(client.colors.economy).setDescription(
                foundDiamond
                  ? t('work.mined-diamond', {
                      lng,
                      rocks: randomRocks.toString(),
                      money: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(randomMoney)
                    })
                  : t('work.mined', {
                      lng,
                      rocks: randomRocks.toString(),
                      money: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(randomMoney)
                    })
              )
            ]
          });
        }
        break;
      case 'fish':
        {
          if (!userData?.inventory.find((item) => item.id === ItemType.FishingRod)) {
            return interaction.reply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('work.no-rod', { lng }))],
              flags: [MessageFlags.Ephemeral]
            });
          }

          const randomFish = getRandomNumber(2, 5);
          const randomScrap = getRandomNumber(1, 3);
          const items = new Array(randomFish).fill(fish).concat(new Array(randomScrap).fill(scrap));

          const caughtBoot = getRandomNumber(1, 100) <= BREAK_CHANCE;

          if (caughtBoot) {
            items.push(boot);
            await removeItem(interaction.user.id, ItemType.FishingRod);
          }

          await addItems(interaction.user.id, items);

          const randomMoney = getRandomNumber(100, 500);
          await addMoney(interaction.user.id, randomMoney);

          interaction.reply({
            embeds: [
              new EmbedBuilder().setColor(client.colors.economy).setDescription(
                caughtBoot
                  ? t('work.fish-boot', {
                      lng,
                      fish: randomFish.toString(),
                      scrap: randomScrap.toString(),
                      money: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(randomMoney)
                    })
                  : t('work.fish', {
                      lng,
                      fish: randomFish.toString(),
                      scrap: randomScrap.toString(),
                      money: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(randomMoney)
                    })
              )
            ]
          });
        }
        break;
      case 'lumber':
        {
          if (!userData?.inventory.find((item) => item.id === ItemType.Axe)) {
            return interaction.reply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('work.no-axe', { lng }))],
              flags: [MessageFlags.Ephemeral]
            });
          }

          const randomWood = getRandomNumber(3, 10);
          const items = new Array(randomWood).fill(wood);
          await addItems(interaction.user.id, items);

          const randomMoney = getRandomNumber(100, 500);
          await addMoney(interaction.user.id, randomMoney);

          const lostAxe = getRandomNumber(1, 100) <= BREAK_CHANCE;
          if (lostAxe) {
            await removeItem(interaction.user.id, ItemType.Axe);
          }

          interaction.reply({
            embeds: [
              new EmbedBuilder().setColor(client.colors.economy).setDescription(
                t(lostAxe ? 'work.lumber-broke' : 'work.lumber', {
                  lng,
                  wood: randomWood.toString(),
                  money: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(randomMoney)
                })
              )
            ]
          });
        }
        break;
      case 'fight':
        {
          if (!userData?.inventory.find((item) => item.id === ItemType.Sword)) {
            return interaction.reply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('work.no-sword', { lng }))],
              flags: [MessageFlags.Ephemeral]
            });
          }

          const failed = getRandomNumber(1, 100) <= DEATH_CHANCE;
          const hasShield = userData?.inventory.find((item) => item.id === ItemType.Shield);

          if (failed && !hasShield) {
            await removeItem(interaction.user.id, ItemType.Sword);

            return interaction.reply({
              embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('work.fight-failed', { lng }))]
            });
          } else if (failed && hasShield) {
            await removeItem(interaction.user.id, ItemType.Shield);
          }

          const randomMoney = getRandomNumber(300, 1000);
          await addMoney(interaction.user.id, randomMoney);

          interaction.reply({
            embeds: [
              new EmbedBuilder().setColor(client.colors.economy).setDescription(
                failed
                  ? t('work.fight-shield', { lng, money: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(randomMoney) })
                  : t('work.fight', {
                      lng,
                      money: Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(randomMoney)
                    })
              )
            ]
          });
        }
        break;
    }
  }
});

import { blush, confused, cringe, cry, dance, happy, nom, sad, smile, smug, think, wave, wink, yes } from 'discord-actions';
import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { ModuleType } from 'types/interactions';

export enum Action {
  Blush = 'blush',
  Confused = 'confused',
  Cringe = 'cringe',
  Cry = 'cry',
  Dance = 'dance',
  Eat = 'eat',
  Happy = 'happy',
  Sad = 'sad',
  Smile = 'smile',
  Smug = 'smug',
  Think = 'think',
  ThumbsUp = 'thumbsup',
  Wave = 'wave',
  Wink = 'wink'
}

export default new Command({
  module: ModuleType.Fun,
  data: new SlashCommandBuilder()
    .setName('action')
    .setDescription('Sends a GIF of your choice (e.g. blush, dance, cry and more)')
    .setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addStringOption((option) =>
      option
        .setName('action')
        .setDescription('The action to perform')
        .setChoices(Object.values(Action).map((action) => ({ name: action, value: action })))
        .setRequired(true)
    ),
  async execute({ interaction, client, lng }) {
    const action = interaction.options.getString('action', true);

    let gif: string | null;
    const message = t(`action.${action}`, {
      lng,
      user: interaction.inCachedGuild() ? interaction.member.displayName : interaction.user.displayName
    });

    switch (action) {
      case Action.Blush:
        gif = (await blush()).url;
        break;
      case Action.Cry:
        gif = (await cry()).url;
        break;
      case Action.Dance:
        gif = (await dance()).url;
        break;
      case Action.Confused:
        gif = (await confused()).reaction;
        break;
      case Action.Cringe:
        gif = (await cringe()).url;
        break;
      case Action.Eat:
        gif = (await nom()).url;
        break;
      case Action.Happy:
        gif = (await happy()).url;
        break;
      case Action.Sad:
        gif = (await sad()).reaction;
        break;
      case Action.Smile:
        gif = (await smile()).url;
        break;
      case Action.Smug:
        gif = (await smug()).url;
        break;
      case Action.Think:
        gif = (await think()).reaction;
        break;
      case Action.ThumbsUp:
        gif = (await yes()).reaction;
        break;
      case Action.Wave:
        gif = (await wave()).url;
        break;
      case Action.Wink:
        gif = (await wink()).url;
        break;
      default:
        gif = null;
        break;
    }

    return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.fun).setDescription(message).setImage(gif)] });
  }
});

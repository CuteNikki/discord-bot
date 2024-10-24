import { bite, bonk, cuddle, feed, highfive, holdhand, hug, kick, kill, kiss, pat, poke, slap, tackle, tickle, yeet, bully } from 'discord-actions';
import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { t } from 'i18next';

import { Command } from 'classes/command';

import { ModuleType } from 'types/interactions';

export enum Interaction {
  Bite = 'bite',
  Bonk = 'bonk',
  Bully = 'bully',
  Cuddle = 'cuddle',
  Feed = 'feed',
  HighFive = 'highfive',
  HoldHand = 'holdhand',
  Hug = 'hug',
  Kick = 'kick',
  Kiss = 'kiss',
  Kill = 'kill',
  Pat = 'pat',
  Poke = 'poke',
  Slap = 'slap',
  Tackle = 'tackle',
  Tickle = 'tickle',
  Yeet = 'yeet'
}

export default new Command({
  module: ModuleType.Fun,
  data: new SlashCommandBuilder()
    .setName('interaction')
    .setDescription('Sends a GIF of your choice (e.g. hug, bonk, yeet and more)')
    .setContexts(InteractionContextType.Guild, InteractionContextType.PrivateChannel, InteractionContextType.BotDM)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addStringOption((option) =>
      option
        .setName('action')
        .setDescription('The action to perform')
        .setChoices(Object.values(Interaction).map((action) => ({ name: action, value: action })))
        .setRequired(true)
    )
    .addUserOption((option) => option.setName('user').setDescription('The user to perform the action on').setRequired(true)),
  async execute({ interaction, client, lng }) {
    const action = interaction.options.getString('action', true);
    const target = interaction.options.getUser('user', true);
    const targetMember = interaction.guild?.members.cache.get(target.id);

    if (target.id === interaction.user.id) {
      return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.error).setDescription(t('interaction.self', { lng }))], ephemeral: true });
    }

    let gif: string | null;
    const message = t(`interaction.${action}`, {
      lng,
      user: interaction.inCachedGuild() ? interaction.member.displayName : interaction.user.displayName,
      target: targetMember ? targetMember.displayName : target.username
    });

    switch (action) {
      case Interaction.Bite:
        gif = (await bite()).url;
        break;
      case Interaction.Bonk:
        gif = (await bonk()).url;
        break;
      case Interaction.Bully:
        gif = (await bully()).url;
        break;
      case Interaction.Cuddle:
        gif = (await cuddle()).url;
        break;
      case Interaction.Feed:
        gif = (await feed()).url;
        break;
      case Interaction.HighFive:
        gif = (await highfive()).url;
        break;
      case Interaction.HoldHand:
        gif = (await holdhand()).url;
        break;
      case Interaction.Hug:
        gif = (await hug()).url;
        break;
      case Interaction.Kick:
        gif = (await kick()).url;
        break;
      case Interaction.Kiss:
        gif = (await kiss()).url;
        break;
      case Interaction.Kill:
        gif = (await kill()).url;
        break;
      case Interaction.Pat:
        gif = (await pat()).url;
        break;
      case Interaction.Poke:
        gif = (await poke()).url;
        break;
      case Interaction.Slap:
        gif = (await slap()).url;
        break;
      case Interaction.Tackle:
        gif = (await tackle()).url;
        break;
      case Interaction.Tickle:
        gif = (await tickle()).url;
        break;
      case Interaction.Yeet:
        gif = (await yeet()).url;
        break;
      default:
        gif = null;
        break;
    }

    return interaction.reply({ embeds: [new EmbedBuilder().setColor(client.colors.fun).setDescription(message).setImage(gif)] });
  }
});

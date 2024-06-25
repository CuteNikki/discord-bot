import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';

import { Command, Contexts, IntegrationTypes, Modules } from 'classes/command';

import { RockPaperScissors } from 'games/rock-paper-scissors';
import { TicTacToe } from 'games/tic-tac-toe';

export default new Command({
  module: Modules.GAMES,
  data: {
    name: 'games',
    description: 'Choose one of the fun games to play',
    type: ApplicationCommandType.ChatInput,
    contexts: [Contexts.GUILD, Contexts.BOT_DM, Contexts.PRIVATE_CHANNEL],
    integration_types: [IntegrationTypes.GUILD_INSTALL, IntegrationTypes.USER_INSTALL],
    options: [
      {
        name: 'rock-paper-scissors',
        description: 'Play a game of rock, paper and scissors!',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'opponent',
            description: 'The user to play against',
            type: ApplicationCommandOptionType.User,
            required: false,
          },
        ],
      },
      {
        name: 'tic-tac-toe',
        description: 'Play a game of Tic Tac Toe!',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'opponent',
            description: 'The user to play against',
            type: ApplicationCommandOptionType.User,
            required: true,
          },
        ],
      },
    ],
  },
  async execute({ interaction, client }) {
    await interaction.deferReply();

    const { options } = interaction;

    switch (options.getSubcommand()) {
      case 'rock-paper-scissors':
        {
          const opponent = options.getUser('opponent', false);

          const game = new RockPaperScissors({
            interaction,
            opponent,
            client,
          });
          game.start();
        }
        break;
      case 'tic-tac-toe':
        {
          const opponent = options.getUser('opponent', true);

          const game = new TicTacToe({
            interaction,
            opponent,
            client,
          });
          game.start();
        }
        break;
    }
  },
});

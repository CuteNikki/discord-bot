import { ApplicationIntegrationType, InteractionContextType, SlashCommandBuilder } from 'discord.js';

import { Command, ModuleType } from 'classes/command';

import { WORDS } from 'constants/words';

import { Connect4 } from 'games/connect4';
import { FastType } from 'games/fast-type';
import { Hangman } from 'games/hangman';
import { Memory } from 'games/memory';
import { RememberEmoji } from 'games/remember-emoji';
import { RockPaperScissors } from 'games/rock-paper-scissors';
import { Snake } from 'games/snake';
import { Sokoban } from 'games/sokoban';
import { Tetris } from 'games/tetris';
import { TicTacToe } from 'games/tic-tac-toe';
import { Trivia, TriviaDifficulty, TriviaMode } from 'games/trivia';

export default new Command({
  module: ModuleType.Fun,
  botPermissions: ['SendMessages'],
  data: new SlashCommandBuilder()
    .setName('games')
    .setDescription('Choose one of the fun games to play')
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('rock-paper-scissors')
        .setDescription('Play a game of rock, paper and scissors!')
        .addUserOption((option) => option.setName('opponent').setDescription('The user to play against').setRequired(false)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('tic-tac-toe')
        .setDescription('Play a game of Tic Tac Toe!')
        .addUserOption((option) => option.setName('opponent').setDescription('The user to play against').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('connect4')
        .setDescription('Play a game of Connect4!')
        .addUserOption((option) => option.setName('opponent').setDescription('The user to play against').setRequired(true))
        .addStringOption((option) =>
          option
            .setName('size')
            .setDescription('The size of connect4')
            .setRequired(false)
            .addChoices(
              { name: 'Original (7x6)', value: 'original' },
              { name: 'Small (6x5)', value: 'small' },
              { name: 'Medium (8x7)', value: 'medium' },
              { name: 'Big (10x9)', value: 'big' },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('hangman')
        .setDescription('Play a game of hangman!')
        .addStringOption((option) =>
          option
            .setName('theme')
            .setDescription('The theme you want your word to be from')
            .setRequired(false)
            .addChoices(
              { name: 'Random', value: 'random' },
              { name: 'Discord', value: 'discord' },
              { name: 'Fruit', value: 'fruit' },
              { name: 'Color', value: 'color' },
              { name: 'Sport', value: 'sport' },
              { name: 'Nature', value: 'nature' },
              { name: 'Camping', value: 'camping' },
              { name: 'Winter', value: 'winter' },
              { name: 'Pokemon', value: 'pokemon' },
              { name: 'Wordle', value: 'wordle' },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('trivia')
        .setDescription('Play a game of Trivia!')
        .addStringOption((option) =>
          option
            .setName('mode')
            .setDescription('Choose between single or multiple choice answers')
            .setRequired(true)
            .addChoices({ name: 'single choice', value: TriviaMode.Single }, { name: 'multiple choice', value: TriviaMode.Multiple }),
        )
        .addStringOption((option) =>
          option
            .setName('difficulty')
            .setDescription('Choose a difficulty')
            .setRequired(true)
            .addChoices(
              { name: 'easy', value: TriviaDifficulty.Easy },
              { name: 'medium', value: TriviaDifficulty.Medium },
              { name: 'hard', value: TriviaDifficulty.Hard },
            ),
        )
        .addIntegerOption((option) =>
          option
            .setName('category')
            .setDescription('Choose a category')
            .setRequired(false)
            .addChoices(
              { name: 'Any Category', value: 0 },
              { name: 'General Knowledge', value: 9 },
              { name: 'Books', value: 10 },
              { name: 'Music', value: 12 },
              { name: 'Television', value: 14 },
              { name: 'Video Games', value: 15 },
              { name: 'Board Games', value: 16 },
              { name: 'Science & Nature', value: 17 },
              { name: 'Computers', value: 18 },
              { name: 'Mathematics', value: 19 },
              { name: 'Mythology', value: 20 },
              { name: 'Sports', value: 21 },
              { name: 'Geography', value: 22 },
              { name: 'History', value: 23 },
              { name: 'Politics', value: 24 },
              { name: 'Art', value: 25 },
              { name: 'Celebrities', value: 26 },
              { name: 'Animals', value: 27 },
              { name: 'Vehicles', value: 28 },
              { name: 'Comics', value: 29 },
              { name: 'Japanese Anime & Manga', value: 31 },
              { name: 'Cartoon & Animation', value: 32 },
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('snake')
        .setDescription('Play a game of Snake!')
        .addStringOption((option) =>
          option
            .setName('size')
            .setDescription('The size of the board')
            .setRequired(false)
            .addChoices(
              { name: 'Very small (5x5)', value: 'very_small' },
              { name: 'Small (6x6)', value: 'small' },
              { name: 'Medium (7x7)', value: 'medium' },
              { name: 'Big (8x8)', value: 'big' },
              { name: 'Very Big (9x9)', value: 'very_big' },
              { name: 'Huge (10x10)', value: 'huge' },
            ),
        ),
    )
    .addSubcommand((subcommand) => subcommand.setName('fast-type').setDescription('Play a game of Fast-Type!'))
    .addSubcommand((subcommand) => subcommand.setName('memory').setDescription('Play a game of Memory!'))
    .addSubcommand((subcommand) => subcommand.setName('remember-emoji').setDescription('Play a game of remember emoji!'))
    .addSubcommand((subcommand) => subcommand.setName('tetris').setDescription('Play a game of Tetris!'))
    .addSubcommand((subcommand) => subcommand.setName('sokoban').setDescription('Play a game of Sokoban!')),
  async execute({ interaction, client }) {
    await interaction.deferReply();

    const { options } = interaction;

    switch (options.getSubcommand()) {
      case 'rock-paper-scissors':
        {
          const opponent = options.getUser('opponent', false);

          new RockPaperScissors({
            interaction,
            opponent,
            client,
          });
        }
        break;
      case 'tic-tac-toe':
        {
          const opponent = options.getUser('opponent', true);

          new TicTacToe({
            interaction,
            opponent,
            client,
          });
        }
        break;
      case 'hangman':
        {
          let theme = options.getString('theme', false);
          const themes = Object.keys(WORDS);
          if (!theme || theme === 'random') theme = themes[Math.floor(Math.random() * themes.length)];

          new Hangman({
            interaction,
            client,
            theme: theme as keyof typeof WORDS,
          });
        }
        break;
      case 'connect4':
        {
          const opponent = options.getUser('opponent', true);

          let scale;

          // Original Connect4 is 7x6
          // Highest supported is 10x9
          // Max supported amount of buttons per row is 5
          switch (options.getString('size', false)) {
            case 'big':
              scale = {
                width: 10,
                height: 9,
                max_buttons: 5,
              };
              break;
            case 'medium':
              scale = {
                width: 8,
                height: 7,
                max_buttons: 4,
              };
              break;
            case 'small':
              scale = {
                width: 6,
                height: 5,
                max_buttons: 3,
              };
              break;
            case 'original':
              scale = {
                width: 7,
                height: 6,
                max_buttons: 4,
              };
              break;
            default:
              scale = {
                width: 7,
                height: 6,
                max_buttons: 4,
              };
              break;
          }

          new Connect4({
            interaction,
            opponent,
            client,
            scale,
          });
        }
        break;
      case 'trivia':
        {
          const mode = options.getString('mode', true);
          const difficulty = options.getString('difficulty', true);
          const category = options.getInteger('category', false) ?? 0;

          new Trivia({
            interaction,
            client,
            category,
            difficulty: difficulty as TriviaDifficulty,
            mode: mode as TriviaMode,
          });
        }
        break;
      case 'snake':
        {
          let size;
          switch (options.getString('size', false)) {
            case 'very_small':
              size = { width: 5, height: 5 };
              break;
            case 'small':
              size = { width: 6, height: 6 };
              break;
            case 'medium':
              size = { width: 7, height: 7 };
              break;
            case 'big':
              size = { width: 8, height: 8 };
              break;
            case 'very_big':
              size = { width: 9, height: 9 };
              break;
            case 'huge':
              size = { width: 10, height: 10 };
              break;
            default:
              size = { width: 10, height: 10 };
              break;
          }

          new Snake({ interaction, client, size });
        }
        break;
      case 'fast-type':
        {
          new FastType({ interaction, client });
        }
        break;
      case 'memory':
        {
          new Memory({ interaction, client });
        }
        break;
      case 'remember-emoji':
        {
          new RememberEmoji({ interaction, client });
        }
        break;
      case 'tetris':
        {
          new Tetris({ interaction, client });
        }
        break;
      case 'sokoban':
        {
          new Sokoban({ interaction, client });
        }
        break;
    }
  },
});

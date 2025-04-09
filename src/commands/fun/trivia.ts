import {
  ApplicationIntegrationType,
  ChatInputCommandInteraction,
  ComponentType,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from 'discord.js';
import { decode } from 'he';

import type { ExtendedClient } from 'classes/client';
import { Command } from 'classes/command';
import { OpenTriviaAPI } from 'classes/trivia-api';
import { TriviaBuilder } from 'classes/trivia-builder';

import logger from 'utility/logger';

import { TriviaCategory, TriviaDifficulty, TriviaType } from 'types/trivia';

const api = new OpenTriviaAPI();

export default new Command({
  builder: new SlashCommandBuilder()
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
    .setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
    .setName('trivia')
    .setDescription('Play a trivia game')
    .addStringOption((option) =>
      option
        .setName('difficulty')
        .setDescription('Select the difficulty level')
        .setChoices(
          { name: 'Easy', value: TriviaDifficulty.Easy },
          { name: 'Medium', value: TriviaDifficulty.Medium },
          { name: 'Hard', value: TriviaDifficulty.Hard },
        )
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Select the type of question')
        .setChoices({ name: 'Multiple Choice', value: TriviaType.MultipleChoice }, { name: 'True/False', value: TriviaType.TrueFalse })
        .setRequired(false),
    )
    .addNumberOption((option) =>
      option.setName('category').setDescription('Select the trivia category').setRequired(false).setAutocomplete(true),
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused();

    if (focused.name === 'category') {
      const categories = await api.getCategories().catch((err) => {
        logger.error({ err }, 'Error fetching trivia categories');
      });

      if (!categories) return interaction.respond([]);

      const query = focused.value.toLowerCase();

      const filtered = categories.filter((category) => category.name.toLowerCase().includes(query));

      const results = [];

      if ('any category'.includes(query) || query === '') {
        results.push({ name: 'Any Category', value: TriviaCategory.AnyCategory });
      }

      results.push(...filtered.map((c) => ({ name: c.name, value: c.id })));

      interaction.respond(results.slice(0, 25));
    }
  },
  async execute(interaction) {
    await interaction.deferReply();

    const difficulty = interaction.options.getString('difficulty');
    const type = interaction.options.getString('type');
    const category = interaction.options.getNumber('category') ?? TriviaCategory.AnyCategory;

    const token = await api.getToken();
    const question = await fetchQuestion(
      (difficulty ?? getRandomDifficulty()) as TriviaDifficulty,
      (type ?? getRandomType()) as TriviaType,
      category,
      token,
    );
    if (!question) return;

    let triviaCard = buildTriviaCard(interaction.client as ExtendedClient, question);
    const message = await sendTriviaMessage(interaction, triviaCard);
    if (!message) return;

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 30_000,
    });

    let hasAnswered = false;

    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        await buttonInteraction.reply({
          content: 'This is not your trivia game!',
          flags: [MessageFlags.Ephemeral],
        });
        return;
      }

      await buttonInteraction.deferUpdate();

      // Handle "Next" button
      if (buttonInteraction.customId === 'trivia-next') {
        hasAnswered = false;

        const question = await fetchQuestion(
          (difficulty ?? getRandomDifficulty()) as TriviaDifficulty,
          (type ?? getRandomType()) as TriviaType,
          category,
          token,
        ).catch((error) => {
          interaction.editReply({
            content: `Error fetching trivia questions: ${error.message}`,
          });
          return;
        });

        if (!question) return;

        triviaCard = new TriviaBuilder(interaction.client as ExtendedClient)
          .setCategory(decode(question.category))
          .setDifficulty(question.difficulty)
          .setType(question.type)
          .setQuestion(decode(question.question))
          .setAnswers(
            decode(question.correctAnswer),
            question.incorrectAnswers.map((answer) => decode(answer)),
          );

        await buttonInteraction
          .editReply({
            content: '',
            files: [await triviaCard.build()],
            components: [triviaCard.getComponents()],
          })
          .catch((error) => logger.error({ error }, 'Error editing trivia message'));

        collector.resetTimer({ time: 30_000 });
        return;
      }

      if (hasAnswered) return;
      hasAnswered = true;

      const answerIndex = parseInt(buttonInteraction.customId.split('_')[1], 10);
      const answer = triviaCard.options.get('shuffledAnswers')?.[answerIndex];
      const correctAnswer = triviaCard.options.get('correctAnswer');
      const isCorrect = answer === correctAnswer;
      const answerLabel = answer;

      const answerMessage = isCorrect
        ? `✅ Correct! The answer is **${correctAnswer}**.`
        : `❌ Incorrect! The correct answer is **${correctAnswer}**. You selected **${answerLabel}**.`;

      triviaCard.setRevealResult(true);

      await buttonInteraction.editReply({
        content: answerMessage,
        components: [triviaCard.getComponents(true)],
        files: [await triviaCard.build()],
      });
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        triviaCard.setRevealResult(true);

        if (hasAnswered) {
          await interaction.editReply({
            components: [triviaCard.getComponents(true, true)],
          });
        } else {
          await interaction.editReply({
            content: `Time is up! The correct answer was **${triviaCard.options.get('correctAnswer')}**.`,
            components: [triviaCard.getComponents(true, true)],
            files: [await triviaCard.build()],
          });
        }
      }
    });
  },
});

async function fetchQuestion(difficulty: TriviaDifficulty, type: TriviaType, category: number, token: string) {
  try {
    const questions = await api.getQuestions({ amount: 1, difficulty, type, category, token });
    return questions?.[0];
  } catch (err) {
    logger.error({ err }, 'Error fetching trivia question');
  }
}

function buildTriviaCard(
  client: ExtendedClient,
  question: {
    question: string;
    category: string;
    difficulty: TriviaDifficulty;
    type: TriviaType;
    correctAnswer: string;
    incorrectAnswers: string[];
    allAnswers: string[];
  },
) {
  return new TriviaBuilder(client)
    .setCategory(decode(question.category))
    .setDifficulty(question.difficulty)
    .setType(question.type)
    .setQuestion(decode(question.question))
    .setAnswers(
      decode(question.correctAnswer),
      question.incorrectAnswers.map((answer) => decode(answer)),
    );
}

async function sendTriviaMessage(interaction: ChatInputCommandInteraction, triviaCard: TriviaBuilder) {
  try {
    return await interaction.editReply({
      files: [await triviaCard.build()],
      components: [triviaCard.getComponents()],
    });
  } catch (error) {
    logger.error({ error }, 'Error sending trivia message');
  }
}

function getRandomDifficulty(): TriviaDifficulty {
  const difficulties = [TriviaDifficulty.Easy, TriviaDifficulty.Medium, TriviaDifficulty.Hard];
  return difficulties[Math.floor(Math.random() * difficulties.length)];
}

function getRandomType(): TriviaType {
  const types = [TriviaType.MultipleChoice, TriviaType.TrueFalse];
  return types[Math.floor(Math.random() * types.length)];
}

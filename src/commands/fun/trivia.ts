import { ApplicationIntegrationType, ComponentType, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { decode } from 'he';

import type { ExtendedClient } from 'classes/client';
import { Command } from 'classes/command';
import { OpenTriviaAPI } from 'classes/trivia-api';
import { TriviaBuilder } from 'classes/trivia-builder';

import { TriviaCategory, TriviaDifficulty, TriviaType } from 'types/trivia';

import logger from 'utility/logger';

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
      const categories = await api.getCategories().catch((err) => logger.error({ err }, 'Error fetching trivia categories'));

      if (!categories) {
        await interaction.respond([]);
        return;
      }

      categories.push({ id: TriviaCategory.AnyCategory, name: 'Any Category' });

      const filtered = categories.filter((category) => category.name.toLowerCase().includes(focused.value.toLowerCase()));
      interaction.respond(filtered.map((category) => ({ name: category.name, value: category.id })).slice(0, 25));
    }
  },
  async execute(interaction) {
    await interaction.deferReply();

    const difficulty = interaction.options.getString('difficulty') ?? TriviaDifficulty.Medium;
    const type = interaction.options.getString('type') ?? (Math.random() < 0.5 ? TriviaType.MultipleChoice : TriviaType.TrueFalse);
    const category = interaction.options.getNumber('category') ?? TriviaCategory.AnyCategory;

    const token = await api.getToken();

    const questions = await api
      .getQuestions({
        amount: 1,
        difficulty: difficulty as TriviaDifficulty,
        type: type as TriviaType,
        category,
        token,
      })
      .catch((error) => {
        interaction.editReply({
          content: `Error fetching trivia questions: ${error.message}`,
        });
        return;
      });

    if (!questions || questions.length === 0) {
      if (!interaction.replied) {
        interaction.editReply({
          content: 'No trivia questions found.',
        });
      }
      return;
    }

    const question = questions[0];

    const triviaCard = new TriviaBuilder(interaction.client as ExtendedClient)
      .setCategory(decode(question.category))
      .setDifficulty(question.difficulty)
      .setType(question.type)
      .setQuestion(decode(question.question))
      .setAnswers(
        decode(question.correctAnswer),
        question.incorrectAnswers.map((answer) => decode(answer)),
      );

    const message = await interaction
      .editReply({
        files: [await triviaCard.build()],
        components: [triviaCard.getComponents()],
      })
      .catch((error) => logger.error({ error }, 'Error sending trivia message'));

    if (!message) {
      return;
    }

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60_000,
    });

    collector.on('collect', async (buttonInteraction) => {
      if (buttonInteraction.user.id !== interaction.user.id) {
        await buttonInteraction.reply({
          content: 'This is not your trivia game!',
          flags: [MessageFlags.Ephemeral],
        });
        return;
      }

      await buttonInteraction.deferUpdate();

      const answerIndex = parseInt(buttonInteraction.customId.split('_')[1], 10);
      const answer = triviaCard.options.get('shuffledAnswers')[answerIndex];
      const correctAnswer = triviaCard.options.get('correctAnswer');
      const isCorrect = answer === correctAnswer;
      const answerLabel = triviaCard.options.get('shuffledAnswers')[answerIndex];
      const answerMessage = isCorrect
        ? `Correct! The answer is **${correctAnswer}**.`
        : `Incorrect! The correct answer is **${correctAnswer}**. You selected **${answerLabel}**.`;

      triviaCard.setRevealResult(true);

      await buttonInteraction.editReply({
        content: answerMessage,
        components: [triviaCard.getComponents(true)],
        files: [await triviaCard.build()],
      });

      collector.stop();
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        await interaction.editReply({
          content: `Time is up! The correct answer was **${triviaCard.options.get('correctAnswer')}**.`,
          components: [triviaCard.getComponents(true)],
          files: [await triviaCard.build()],
        });
      }
    });
  },
});

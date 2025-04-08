import { ApplicationIntegrationType, InteractionContextType, MessageFlags, SlashCommandBuilder } from 'discord.js';

import { Command } from 'classes/command';
import { TriviaBuilder, TriviaCategory, TriviaDifficulty, TriviaType } from 'classes/trivia-builder';

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
      option
        .setName('category')
        .setDescription('Select the trivia category')
        .setChoices(
          { name: 'Any Category', value: TriviaCategory.Any },
          { name: 'General Knowledge', value: TriviaCategory.GeneralKnowledge },
          { name: 'Books', value: TriviaCategory.Books },
          { name: 'Film', value: TriviaCategory.Film },
          { name: 'Music', value: TriviaCategory.Music },
          { name: 'Musicals & Theatres', value: TriviaCategory.MusicalsAndTheatres },
          { name: 'Television', value: TriviaCategory.Television },
          { name: 'Video Games', value: TriviaCategory.VideoGames },
          { name: 'Board Games', value: TriviaCategory.BoardGames },
          { name: 'Nature', value: TriviaCategory.Nature },
          { name: 'Computers', value: TriviaCategory.Computers },
          { name: 'Mathematics', value: TriviaCategory.Mathematics },
          { name: 'Mythology', value: TriviaCategory.Mythology },
          { name: 'Sports', value: TriviaCategory.Sports },
          { name: 'Geography', value: TriviaCategory.Geography },
          { name: 'History', value: TriviaCategory.History },
          { name: 'Politics', value: TriviaCategory.Politics },
          { name: 'Art', value: TriviaCategory.Art },
          { name: 'Celebrities', value: TriviaCategory.Celebrities },
          { name: 'Animals', value: TriviaCategory.Animals },
          { name: 'Vehicles', value: TriviaCategory.Vehicles },
          { name: 'Comics', value: TriviaCategory.Comics },
          { name: 'Gadgets', value: TriviaCategory.Gadgets },
          { name: 'Anime & Manga', value: TriviaCategory.AnimeAndManga },
          { name: 'Cartoons & Animations', value: TriviaCategory.CartoonsAndAnimations },
        )
        .setRequired(false),
    ),
  async execute(interaction) {
    const difficulty = interaction.options.getString('difficulty') ?? TriviaDifficulty.Medium;
    const type = (interaction.options.getString('type') ?? Math.random() < 0.5) ? TriviaType.MultipleChoice : TriviaType.TrueFalse;
    const category = interaction.options.getNumber('category') ?? TriviaCategory.Any;

    // @todo: Implement the trivia API integration

    const triviaCard = new TriviaBuilder()
      .setCategory(category)
      .setDifficulty(difficulty as TriviaDifficulty)
      .setType(type as TriviaType)
      .setQuestion('What is the capital of France?')
      .setAnswers('Paris', ['London', 'Berlin', 'Madrid']);

    interaction.reply({
      content: 'This command is not implemented yet. The API integeation is missing. Please check back later.', // @todo: Remove this line
      files: [await triviaCard.build()],
      flags: [MessageFlags.Ephemeral],
    });

    /**
     * @todo: handle the trivia game logic
     * that includes sending the trivia question with buttons, waiting for the user's response, and checking if the answer is correct.
     */
  },
});

import type { ExtendedClient } from "classes/client";

export enum TriviaCategory {
  AnyCategory = 0,
  GeneralKnowledge = 9,
  Books = 10,
  Film = 11,
  Music = 12,
  MusicalsAndTheatres = 13,
  Television = 14,
  VideoGames = 15,
  BoardGames = 16,
  Nature = 17,
  Computers = 18,
  Mathematics = 19,
  Mythology = 20,
  Sports = 21,
  Geography = 22,
  History = 23,
  Politics = 24,
  Art = 25,
  Celebrities = 26,
  Animals = 27,
  Vehicles = 28,
  Comics = 29,
  Gadgets = 30,
  AnimeAndManga = 31,
  CartoonsAndAnimations = 32,
}
export enum TriviaType {
  MultipleChoice = 'multiple',
  TrueFalse = 'boolean',
}
export enum TriviaDifficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard',
}

export interface TriviaProps {
  client: ExtendedClient;
  answerLabels: { text: string; emoji: string }[];
  type: TriviaType;
  difficulty: TriviaDifficulty;
  category: string;
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  shuffledAnswers: string[];
  revealResult: boolean;
}

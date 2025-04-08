/** @jsx JSX.createElement */
/** @jsxFrag JSX.Fragment */

// The JSX pragma tells transpiler how to transform JSX into the equivalent JavaScript code

// import Canvacord
// Builder = The base class for creating custom builders
// JSX = The JSX pragma for creating elements
// Font = The Font class for loading custom fonts
// FontFactory = The FontFactory for managing fonts

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Builder, Font, FontFactory, JSX } from 'canvacord';

import logger from 'utility/logger';

export enum TriviaCategory {
  Any = 0,
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

interface TriviaProps {
  type: TriviaType;
  difficulty: TriviaDifficulty;
  category: TriviaCategory;
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
}

export class TriviaBuilder extends Builder<TriviaProps> {
  constructor() {
    // @ts-expect-error Expects a width and height - works fine without specified and automatically adjusts
    super();

    if (!FontFactory.size) Font.loadDefault();
  }

  public setQuestion(question: string) {
    this.options.set('question', question);
    return this;
  }

  public setCategory(category: number) {
    this.options.set('category', category);
    return this;
  }

  public setDifficulty(difficulty: TriviaDifficulty) {
    this.options.set('difficulty', difficulty);
    return this;
  }

  public setType(type: TriviaType) {
    this.options.set('type', type);
    return this;
  }

  public setAnswers(correct: string, incorrect: string[]) {
    this.options.set('correctAnswer', correct);
    this.options.set('incorrectAnswers', incorrect);
    return this;
  }

  private getShuffledAnswers(correctAnswer: string, incorrectAnswers: string[]): string[] {
    if (!correctAnswer) {
      logger.debug('No correct answer provided');
      return [];
    }
    const answers = [...incorrectAnswers, correctAnswer];
    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]];
    }
    return answers;
  }

  public async render() {
    const question = this.options.get('question');
    const category = TriviaCategory[this.options.get('category')];
    const difficulty = this.options.get('difficulty');
    const type = this.options.get('type');
    const correctAnswer = this.options.get('correctAnswer');
    const incorrectAnswers = this.options.get('incorrectAnswers');
    const answers = this.getShuffledAnswers(correctAnswer, incorrectAnswers);

    const answerLabels = ['A', 'B', 'C', 'D'];

    return (
      <div
        style={{
          display: 'flex',
          background: 'linear-gradient(135deg, #ff7e5f, #feb47b)', // Gradient background
          width: '100%',
          height: '100%',
          padding: '20px',
          borderRadius: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff81',
            padding: '25px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            color: '#333',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              flexDirection: 'row',
              gap: '8px',
              fontSize: '14px',
              maxWidth: '440px',
            }}
          >
            <span
              style={{
                backgroundColor: '#e0f7fa',
                color: '#00796b',
                padding: '4px 8px',
                borderRadius: '8px',
                fontWeight: 'bold',
                textTransform: 'capitalize',
              }}
            >
              Category: {category}
            </span>
            <span
              style={{
                backgroundColor: '#ffe0b2',
                color: '#e65100',
                padding: '4px 8px',
                borderRadius: '8px',
                fontWeight: 'bold',
                textTransform: 'capitalize',
              }}
            >
              Type: {type === TriviaType.MultipleChoice ? 'Multiple Choice' : 'True/False'}
            </span>
            <span
              style={{
                backgroundColor:
                  difficulty === TriviaDifficulty.Easy ? '#d4ffdcff' : difficulty === TriviaDifficulty.Medium ? '#faffcb' : '#ffc8c8',
                color: difficulty === TriviaDifficulty.Easy ? '#006105' : difficulty === TriviaDifficulty.Medium ? '#b16400' : '#aa0000',
                padding: '4px 8px',
                borderRadius: '8px',
                fontWeight: 'bold',
                textTransform: 'capitalize',
              }}
            >
              Difficulty: {difficulty}
            </span>
          </div>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              padding: '4px 8px',
              borderRadius: '8px',
              backgroundColor: '#e3f2fd',
              color: '#0d47a1',
              margin: '8px 0px 12px 0px',
              maxWidth: '440px',
            }}
          >
            Question: {question}
          </span>
          <ul style={{ listStyleType: 'none', paddingLeft: '0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {answers.map((answer, index) => (
              <li
                key={index}
                style={{
                  backgroundColor: '#f1f1f1',
                  padding: '10px',
                  marginBottom: '8px',
                  borderRadius: '5px',
                  fontSize: '16px',
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '4px',
                  maxWidth: '440px',
                }}
              >
                <strong>{answerLabels[index]}:</strong>
                <span>{answer}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}

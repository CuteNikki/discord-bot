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
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

import type { ExtendedClient } from 'classes/client';

import logger from 'utility/logger';

import { TriviaDifficulty, type TriviaProps, TriviaType } from 'types/trivia';

export class TriviaBuilder extends Builder<TriviaProps> {
  constructor(client: ExtendedClient) {
    // @ts-expect-error Expects a width and height - works fine without specified and automatically adjusts
    super();

    this.options.set('answerLabels', [
      { text: 'A', emoji: client.customEmojis.a_.id },
      { text: 'B', emoji: client.customEmojis.b_.id },
      { text: 'C', emoji: client.customEmojis.c_.id },
      { text: 'D', emoji: client.customEmojis.d_.id },
    ]);

    if (!FontFactory.size) Font.loadDefault();
  }

  public setQuestion(question: string) {
    this.options.set('question', question);
    return this;
  }

  public setCategory(category: string) {
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

  public setRevealResult(revealResult: boolean) {
    this.options.set('revealResult', revealResult);
    return this;
  }

  public setAnswers(correct: string, incorrect: string[]) {
    this.options.set('correctAnswer', correct);
    this.options.set('incorrectAnswers', incorrect);
    this.options.set('shuffledAnswers', this.getShuffledAnswers(correct, incorrect));
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

  public getComponents(result?: boolean, timedOut?: boolean) {
    const row = new ActionRowBuilder<ButtonBuilder>();

    const answers = this.options.get('shuffledAnswers');

    answers.map((answer, index) => {
      const button = new ButtonBuilder()
        .setCustomId(`trivia-answer_${index}`)
        .setEmoji({ id: this.options.get('answerLabels')[index].emoji })
        .setStyle(
          result ? (answer === this.options.get('correctAnswer') ? ButtonStyle.Success : ButtonStyle.Danger) : ButtonStyle.Secondary,
        )
        .setDisabled(result ? true : false);
      row.addComponents(button);
    });
    if (result && !timedOut)
      row.addComponents(new ButtonBuilder().setCustomId('trivia-next').setEmoji({ name: '➡️' }).setStyle(ButtonStyle.Primary));

    return row;
  }

  public async render() {
    const question = this.options.get('question');
    const category = this.options.get('category');
    const difficulty = this.options.get('difficulty');
    const type = this.options.get('type');
    const answers = this.options.get('shuffledAnswers');
    const result = this.options.get('revealResult');

    return (
      <div
        className='flex p-5 rounded-lg'
        style={{
          background: 'linear-gradient(135deg,rgb(157, 192, 192),rgb(243, 123, 254))', // Gradient background
        }}
      >
        <div
          className='flex flex-col p-5 rounded-lg'
          style={{
            backgroundColor: '#ffffff81',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            color: '#333',
          }}
        >
          <div className='flex flex-wrap max-w-md' style={{ gap: '6px' }}>
            <span
              className='px-2 py-1 rounded-lg capitalize'
              style={{
                backgroundColor: '#e0f8fa',
                color: '#00584e',
              }}
            >
              {category}
            </span>
            <span
              className='px-2 py-1 rounded-lg capitalize'
              style={{
                backgroundColor: '#fff6d9',
                color: '#494733',
              }}
            >
              {type === TriviaType.MultipleChoice ? 'Multiple Choice' : 'Single Choice'}
            </span>
            <span
              className='px-2 py-1 rounded-lg capitalize'
              style={{
                backgroundColor:
                  difficulty === TriviaDifficulty.Easy ? '#d4ffdcff' : difficulty === TriviaDifficulty.Medium ? '#faffcb' : '#ffd8d8',
                color: difficulty === TriviaDifficulty.Easy ? '#006105' : difficulty === TriviaDifficulty.Medium ? '#884d00' : '#aa0000',
              }}
            >
              {difficulty}
            </span>
          </div>
          <span
            className='text-lg p-2 rounded-lg my-2 max-w-md'
            style={{
              backgroundColor: '#e3f2fd',
              color: '#0d47a1',
            }}
          >
            {question}
          </span>
          <ul className='flex flex-col'>
            {answers.map((answer, index) => (
              <li
                key={index}
                className='flex max-w-md px-4 py-2 rounded-md mb-2'
                style={{
                  gap: '10px',
                  backgroundColor: result ? (answer === this.options.get('correctAnswer') ? '#d5ffc4' : '#ffd7d7') : '#f1f1f1',
                }}
              >
                <strong>{this.options.get('answerLabels')[index].text}:</strong>
                <span>{answer}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}

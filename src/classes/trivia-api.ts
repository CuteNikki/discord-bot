import { TriviaCategory, TriviaDifficulty, TriviaType } from 'types/trivia';

export class OpenTriviaAPI {
  private static baseURL: string = 'https://opentdb.com';

  public static async getToken(): Promise<string> {
    const response = await fetch(`${this.baseURL}/api_token.php?command=request`);
    if (!response.ok) {
      throw new Error(`Error fetching token: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.response_code !== 0) {
      throw new Error(`Error fetching token: ${data.response_message}`);
    }

    return data.token;
  }

  public static async resetToken(token: string): Promise<boolean> {
    const response = await fetch(`${this.baseURL}/api_token.php?command=reset&token=${token}`);
    if (!response.ok) {
      throw new Error(`Error resetting token: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.response_code !== 0) {
      throw new Error(`Error resetting token: ${data.response_message}`);
    }

    return data.response_code === 0;
  }

  public static async getCategories(): Promise<{ id: number; name: string }[]> {
    const response = await fetch(`${this.baseURL}/api_category.php`);
    if (!response.ok) {
      throw new Error(`Error fetching categories: ${response.statusText}`);
    }

    const data = await response.json();

    return data.trivia_categories;
  }

  public static async getQuestions(options: {
    amount: number;
    category: TriviaCategory;
    difficulty: TriviaDifficulty;
    type: TriviaType;
    token?: string;
    encoding?: string;
  }): Promise<
    {
      question: string;
      category: string;
      difficulty: TriviaDifficulty;
      type: TriviaType;
      correctAnswer: string;
      incorrectAnswers: string[];
      allAnswers: string[];
    }[]
  > {
    const params = new URLSearchParams({
      amount: options.amount.toString(),
      category: options.category.toString(),
      difficulty: options.difficulty,
      type: options.type,
      encoding: 'none',
    });

    if (options.token) {
      params.append('token', options.token);
    }

    const response = await fetch(`${this.baseURL}/api.php?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Error fetching questions: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.response_code !== 0) {
      throw new Error(`Error fetching questions: ${data.response_message}`);
    }

    return data.results.map(
      (question: {
        question: string;
        category: string;
        difficulty: string;
        type: string;
        correct_answer: string;
        incorrect_answers: string[];
      }) => ({
        question: question.question,
        category: question.category,
        difficulty: question.difficulty,
        type: question.type,
        correctAnswer: question.correct_answer,
        incorrectAnswers: question.incorrect_answers,
        allAnswers: [question.correct_answer, ...question.incorrect_answers],
      }),
    );
  }
}

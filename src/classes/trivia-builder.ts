import { createCanvas } from 'canvas';
import { AttachmentBuilder } from 'discord.js';

export class TriviaBuilder {
  private canvas = createCanvas(700, 250);
  private context = this.canvas.getContext('2d');

  public async build(): Promise<AttachmentBuilder> {
    const canvas = this.canvas;

    return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'trivia.png' });
  }
}

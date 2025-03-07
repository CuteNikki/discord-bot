import { createCanvas, loadImage } from 'canvas';
import { AttachmentBuilder } from 'discord.js';
import { readFile } from 'fs/promises';

/**
 * A class to build an image for a user.
 */
export class CardBuilder {
  private canvas = createCanvas(700, 250);
  private context = this.canvas.getContext('2d');

  private username: string | null = null;
  private avatarUrl: string | null = null;
  private topText: string = 'Profile';
  private backgroundUrl: string = 'src/assets/profile.jpg';

  /**
   * Builds the image.
   * @returns The attachment of the image.
   */
  public async build(): Promise<AttachmentBuilder> {
    const username = this.username;
    const avatarUrl = this.avatarUrl;
    const topText = this.topText;
    const backgroundUrl = this.backgroundUrl;

    if (!username) {
      throw new Error('Username is required to build the image.');
    }
    if (!avatarUrl) {
      throw new Error('Avatar URL is required to build the image.');
    }

    await this.drawBackground(backgroundUrl);
    await this.drawAvatar(avatarUrl);
    await this.drawUsername(username, topText);

    const canvas = this.canvas;

    return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'image.png' });
  }

  /**
   * Sets the avatar URL to build the image for.
   * @param avatarUrl The avatar URL of the user to build the image for.
   * @returns The updated instance of the builder.
   */
  public setAvatarUrl(avatarUrl: string): this {
    this.avatarUrl = avatarUrl;
    return this;
  }

  /**
   * Sets the username to build the image for.
   * @param username The username to build the image for.
   * @returns The updated instance of the builder.
   */
  public setUsername(username: string): this {
    this.username = username;
    return this;
  }

  /**
   * Sets the top text to display on the image.
   * @param topText The top text to display on the image.
   * @returns The updated instance of the builder.
   */
  public setTopText(topText: string): this {
    this.topText = topText;
    return this;
  }

  /**
   * Sets the background URL to use for the image.
   * @param backgroundUrl The background URL to use for the image.
   * @returns The updated instance of the builder.
   */
  public setBackgroundUrl(backgroundUrl: string): this {
    this.backgroundUrl = backgroundUrl;
    return this;
  }

  /**
   * Draws the background image on the canvas.
   * @param backgroundUrl The background URL to draw on the canvas.
   */
  private async drawBackground(backgroundUrl: string): Promise<void> {
    const context = this.context;
    const canvas = this.canvas;
    const radius = 30; // Adjust the radius as needed
    const strokeWidth = 10; // Border thickness
    const strokeColor = '#ffffff22'; // Border color

    // Adjusting for stroke width
    const offset = strokeWidth / 2;

    // Create the rounded rectangle path.
    context.beginPath();
    context.moveTo(offset + radius, offset);
    context.lineTo(canvas.width - offset - radius, offset);
    context.arcTo(canvas.width - offset, offset, canvas.width - offset, offset + radius, radius);
    context.lineTo(canvas.width - offset, canvas.height - offset - radius);
    context.arcTo(canvas.width - offset, canvas.height - offset, canvas.width - offset - radius, canvas.height - offset, radius);
    context.lineTo(offset + radius, canvas.height - offset);
    context.arcTo(offset, canvas.height - offset, offset, canvas.height - offset - radius, radius);
    context.lineTo(offset, offset + radius);
    context.arcTo(offset, offset, offset + radius, offset, radius);
    context.closePath();

    // Save the state and clip to the rounded rectangle.
    context.save();
    context.clip();

    /**
     * Draw the background image within the clipped (rounded) area.
     * @todo: Add option to use a solid color instead of an image.
     * @todo: Add option to use an imageURL instead of a local file.
     */
    const background = await loadImage(await readFile(backgroundUrl));
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Restore clipping but keep stroke aligned
    context.restore();

    // Apply stroke with proper offset
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;
    context.stroke();
  }

  /**
   * Draws the user's avatar on the canvas.
   * @param avatarUrl The avatar URL of the user to draw.
   */
  private async drawAvatar(avatarUrl: string): Promise<void> {
    const context = this.context;

    // Save the canvas state before clipping
    context.save();

    const avatarSize = 175; // Desired avatar width and height
    const xCenter = 125; // X-coordinate of the avatar's center
    const yCenter = 125; // Y-coordinate of the avatar's center
    const x = xCenter - avatarSize / 2; // Top-left X-coordinate
    const y = yCenter - avatarSize / 2; // Top-left Y-coordinate

    context.beginPath();
    context.arc(xCenter, yCenter, avatarSize / 2, 0, Math.PI * 2, true);
    context.closePath();
    context.clip();

    // Load and draw avatar image
    const avatar = await loadImage(avatarUrl);
    context.drawImage(avatar, x, y, avatarSize, avatarSize);

    // Restore the canvas state
    context.restore();
  }

  /**
   * Draws the user's username on the canvas.
   * @param username The username of the user to draw.
   * @param topText The top text to draw.
   */
  private async drawUsername(username: string, topText: string): Promise<void> {
    const context = this.context;
    const canvas = this.canvas;

    context.font = '28px sans-serif';
    context.fillStyle = '#ffffff';
    context.fillText(topText, canvas.width / 2.5, canvas.height / 3);

    context.font = this.applyText(username);
    context.fillStyle = '#ffffff';
    context.fillText(username, canvas.width / 2.5, canvas.height / 1.75);

    /**
     * @todo: Remove this code
     * Playing aroud with text placement
     *
     * context.font = '28px sans-serif';
     * context.fillStyle = '#ffffff';
     * context.fillText('Balance', canvas.width / 2.5, canvas.height / 1.5);
     *
     * context.font = '18px sans-serif';
     * context.fillStyle = '#ffffffcc';
     * context.fillText('$100.00', canvas.width / 2.5, canvas.height / 1.25);
     *
     * context.font = '28px sans-serif';
     * context.fillStyle = '#ffffff';
     * context.fillText('Level', canvas.width / 1.5, canvas.height / 1.5);
     *
     * context.font = '18px sans-serif';
     * context.fillStyle = '#ffffffcc';
     * context.fillText('100', canvas.width / 1.5, canvas.height / 1.25);
     */
  }

  /**
   * Applies the appropriate font size to the text.
   * @param text The text to apply the font size.
   */
  private applyText(text: string): string {
    const context = this.context;
    const maxWidth = this.canvas.width - 300;

    let fontSize = 50;

    context.font = `${fontSize}px sans-serif`;

    while (context.measureText(text).width > maxWidth && fontSize > 10) {
      fontSize -= 1; // decrease gradually for finer control
      context.font = `${fontSize}px sans-serif`;
    }

    return context.font;
  }
}

import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, CommandInteraction, ComponentType, EmbedBuilder, Message, MessageFlags } from 'discord.js';
import logger from 'utility/logger';

type getPageContent = (index: number, totalPages: number) => EmbedBuilder;

type ButtonProps = {
  data: ButtonBuilder;
  disableOn: (index: number, totalPages: number) => boolean;
  onClick: (index: number, totalPages: number, buttonInteraction: ButtonInteraction) => number | Promise<number>;
};

type Buttons = Array<(index: number, totalPages: number) => ButtonProps>;

type PaginationProps = {
  initialIndex?: number;
  totalPages: number;
  getPageContent: getPageContent;
  buttons: Buttons;
  interaction: CommandInteraction;
  timeout?: number;
};

/**
 * A class to handle paginated messages
 */
export class Pagination {
  private getPageContent: getPageContent;
  private buttons: Buttons;
  private index: number;
  private totalPages: number;
  private interaction: CommandInteraction;
  private timeout: number;

  constructor(props: PaginationProps) {
    this.getPageContent = props.getPageContent;
    this.buttons = props.buttons;
    this.index = props.initialIndex ?? 0;
    this.totalPages = props.totalPages;
    this.interaction = props.interaction;
    this.timeout = props.timeout ?? 60_000;

    // Start the pagination
    this.sendMessage();
  }

  /**
   * The start of the pagination, sending a message with the first page and buttons
   */
  private async sendMessage(): Promise<void> {
    const message = await this.interaction
      .editReply({ embeds: [this.getPageContent(this.index, this.totalPages)], components: this.getComponents() })
      .catch((error) => logger.debug({ err: error }, 'Failed to send message'));

    if (!message) return;

    this.collectInteractions(message);
  }

  /**
   * Collect interactions on the message
   * @param message The message to collect interactions on
   */
  private collectInteractions(message: Message): void {
    const buttonInteractionCollector = message.createMessageComponentCollector({ componentType: ComponentType.Button, idle: this.timeout });

    buttonInteractionCollector.on('collect', (buttonInteraction) => this.handleCollect(buttonInteraction, message));
    buttonInteractionCollector.on('end', () => this.handleTimeout(message));
  }

  /**
   * Handle a button interaction and update the message accordingly
   * @param buttonInteraction The button interaction object
   * @param message The message to be updated
   */
  private async handleCollect(buttonInteraction: ButtonInteraction, message: Message): Promise<void> {
    const button = this.isValidButton(buttonInteraction);
    if (!button) return;

    // Call the onClick function and get the new index
    let newIndex: number;
    try {
      newIndex = await button.onClick(this.index, this.totalPages, buttonInteraction);
    } catch (error) {
      logger.debug({ err: error }, 'Error in button onClick handler');
      await buttonInteraction.reply({ content: 'Something went wrong.', flags: [MessageFlags.Ephemeral] }).catch(() => {});

      return;
    }
    if (!this.isValidIndex(newIndex)) return;

    // Update the index
    this.index = newIndex;

    // If the interaction was already replied to (like when a modal was used), don't call update()
    if (buttonInteraction.replied || buttonInteraction.deferred) {
      await message
        .edit({ embeds: [this.getPageContent(this.index, this.totalPages)], components: this.getComponents() })
        .catch((error) => logger.debug({ err: error }, 'Failed to update message'));
      return;
    }

    // Otherwise, update the message using the buttonInteraction
    await buttonInteraction
      .update({ embeds: [this.getPageContent(this.index, this.totalPages)], components: this.getComponents() })
      .catch((error) => logger.debug({ err: error }, 'Failed to update message'));
  }

  /**
   * Check if the index is valid
   * @param newIndex The new index to check
   * @returns If the index is valid
   */
  private isValidIndex(newIndex: number): boolean {
    return newIndex !== this.index && newIndex >= 0 && newIndex < this.totalPages;
  }

  /**
   * Handle the timeout/end of the collector
   * @param message The message to edit
   */
  private async handleTimeout(message: Message): Promise<void> {
    await message
      .edit({ content: 'The pagination session has ended. Please re-run the command to start over.', components: [] })
      .catch((error) => logger.debug({ err: error }, 'Failed to remove components'));
  }

  /**
   * Get the properties for the buttons
   * @returns The button properties
   */
  private getButtonProps(): ButtonProps[] {
    return this.buttons.map((button) => button(this.index, this.totalPages));
  }

  /**
   * Check if the button interaction is valid
   * @param interaction The interaction to check
   * @returns The button props if found
   */
  private isValidButton(interaction: ButtonInteraction): ButtonProps | undefined {
    return this.getButtonProps().find((button) => 'custom_id' in button.data.data && button.data.data.custom_id === interaction.customId);
  }

  /**
   * Set the disable state for a button
   * @param buttonProps The button properties
   */
  private setButtonDisableState(buttonProps: ButtonProps): void {
    buttonProps.data.setDisabled(buttonProps.disableOn(this.index, this.totalPages));
  }

  /**
   * Generate the action rows with all updated buttons
   * @returns The generated components
   */
  private getComponents(): ActionRowBuilder<ButtonBuilder>[] {
    const buttonPropsList = this.getButtonProps();
    const buttonRows: ActionRowBuilder<ButtonBuilder>[] = [];
    let row: ButtonBuilder[] = [];

    buttonPropsList.forEach((buttonProps) => {
      this.setButtonDisableState(buttonProps); // Disable button if needed
      row.push(buttonProps.data);

      // If the row has 5 buttons, push it into the buttonRows and reset row
      if (row.length === 5) {
        buttonRows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(...row));
        row = []; // Reset the row
      }
    });

    // Push any remaining buttons into the final row if they exist
    if (row.length > 0) {
      buttonRows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(...row));
    }

    return buttonRows;
  }
}

import type { ButtonBuilder, ButtonInteraction, CommandInteraction, EmbedBuilder } from 'discord.js';

export type PaginationButtonResult = {
  newIndex: number;
  locate?: string;
};

export type PaginationButtonProps = {
  data: ButtonBuilder;
  disableOn: (index: number, totalPages: number) => boolean;
  onClick: (
    index: number,
    totalPages: number,
    buttonInteraction: ButtonInteraction,
  ) => Promise<PaginationButtonResult> | PaginationButtonResult;
};

export type PaginationButtons = Array<(index: number, totalPages: number) => PaginationButtonProps>;

export type PaginationProps = {
  getPageContent: (index: number, totalPages: number, locate?: string) => (EmbedBuilder[] | null) | Promise<EmbedBuilder[] | null>;
  getTotalPages: () => number | Promise<number>;
  buttons: PaginationButtons;
  interaction: CommandInteraction;
  notFoundEmbed?: EmbedBuilder;
  initialIndex?: number;
  timeout?: number;
};

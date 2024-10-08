import type { ImageSource } from 'canvacord';

export type Texts = {
  level: string;
  xp: string;
  rank: string;
};

export type PropsType = {
  variant?: 'horizontal' | 'default';
  background?: ImageSource | null;
  backgroundColor?: string;
  header?: {
    title: string;
    subtitle: string;
    image: ImageSource;
  };
  players: {
    displayName: string;
    username: string;
    level: number;
    xp: number;
    rank: number;
    avatar: ImageSource;
  }[];
  text?: Texts;
  abbreviate?: boolean;
};

export type LeaderboardProps = PropsType & { text: Texts; background: ImageSource | null; backgroundColor: string; abbreviate: boolean };

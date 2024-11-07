import type { ImageSource, Stylable } from 'canvacord';

export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'streaming' | 'invisible' | 'none';

export type CardTexts = Partial<{
  level: string;
  xp: string;
  rank: string;
}>;

export type CardStyles = Partial<{
  container: Stylable;
  background: Stylable;
  overlay: Stylable;
  avatar: Partial<{
    container: Stylable;
    image: Stylable;
    status: Stylable;
  }>;
  username: Partial<{
    container: Stylable;
    name: Stylable;
    handle: Stylable;
  }>;
  progressbar: Partial<{
    container: Stylable;
    thumb: Stylable;
    track: Stylable;
  }>;
  statistics: Partial<{
    container: Stylable;
    level: Partial<{
      container: Stylable;
      text: Stylable;
      value: Stylable;
    }>;
    xp: Partial<{
      container: Stylable;
      text: Stylable;
      value: Stylable;
    }>;
    rank: Partial<{
      container: Stylable;
      text: Stylable;
      value: Stylable;
    }>;
  }>;
}>;

export interface CardPropsType {
  handle: string | null;
  username: string | null;
  avatar?: string;
  status: PresenceStatus | null;
  currentXP: number | null;
  requiredXP: number | null;
  rank: number | null;
  level: number | null;
  backgroundColor?: string;
  abbreviate?: boolean;
  texts?: CardTexts;
  styles?: CardStyles;
}

export type RankCardProps = CardPropsType & {
  texts: CardTexts;
  styles: CardStyles;
  abbreviate: boolean;
};

export type LeaderboardTexts = {
  level: string;
  xp: string;
  rank: string;
};

export type EconomyLeaderboardTexts = {
  bank: string;
  wallet: string;
  rank: string;
};

export type LeaderboardPropsType = {
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
    avatar?: ImageSource;
  }[];
  text?: LeaderboardTexts;
  abbreviate?: boolean;
};

export type EconomyLeaderboardPropsType = {
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
    bank: number;
    wallet: number;
    rank: number;
    avatar?: ImageSource;
  }[];
  text?: EconomyLeaderboardTexts;
  abbreviate?: boolean;
};

export type LeaderboardProps = LeaderboardPropsType & {
  text: LeaderboardTexts;
  background: ImageSource | null;
  backgroundColor: string;
  abbreviate: boolean;
};

export type EconomyLeaderboardProps = EconomyLeaderboardPropsType & {
  text: EconomyLeaderboardTexts;
  background: ImageSource | null;
  backgroundColor: string;
  abbreviate: boolean;
};

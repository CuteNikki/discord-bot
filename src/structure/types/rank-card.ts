import type { Stylable } from "canvacord";

export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'offline' | 'streaming' | 'invisible' | 'none';

export type Texts = Partial<{
  level: string;
  xp: string;
  rank: string;
}>;

export type Styles = Partial<{
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

export interface PropsType {
  handle: string | null;
  username: string | null;
  avatar: string;
  status: PresenceStatus | null;
  currentXP: number | null;
  requiredXP: number | null;
  rank: number | null;
  level: number | null;
  backgroundColor?: string;
  abbreviate?: boolean;
  texts?: Texts;
  styles?: Styles;
}

export type RankCardProps = PropsType & {
  texts: Texts;
  styles: Styles;
  abbreviate: boolean;
};

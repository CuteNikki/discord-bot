//
// Rank-Card Constants
//

export const statusColors = {
  online: '#43b581',
  idle: '#faa61a',
  dnd: '#f04747',
  offline: '#747f8d',
  streaming: '#593695',
  invisible: '#747f8d'
};

//
// Leaderboard Constants
//

export const leaderboardColors = {
  gold: '#ffaa00',
  silver: '#ada69f',
  bronze: '#cd7f32'
};

export type LeaderboardVariants = 'default' | 'horizontal';

export const LB_MIN_RENDER_HEIGHT = 420;
export const LB_HEIGHT_INTERVAL = [394, 498, 594, 690, 786, 882, 978, 1074] as const;

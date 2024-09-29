export enum BadgeType {
  Developer,
  StaffMember,
  Translator,
  Supporter,
  ExpertBughunter,
  Bughunter
}

export type Badge = {
  id: BadgeType;
  receivedAt: number;
};

export type UserDocument = {
  _id: string;
  userId: string;
  banned: boolean;
  language?: string;
  badges: Badge[];
};

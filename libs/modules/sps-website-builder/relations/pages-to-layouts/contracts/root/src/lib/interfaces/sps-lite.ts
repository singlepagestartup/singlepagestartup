export const variants = ["default"] as const;

export interface IRelation {
  id: string;
  pageId: string;
  layoutId: string;
  orderIndex: number;
  className?: string;
  variant: (typeof variants)[number];
}

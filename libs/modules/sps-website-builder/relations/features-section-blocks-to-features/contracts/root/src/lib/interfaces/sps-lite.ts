export const variants = ["default"] as const;

export interface IRelation {
  id: string;
  variant: (typeof variants)[number];
  orderIndex: number;
  className?: string;
  featuresSectionBlockId: string;
  featureId: string;
}

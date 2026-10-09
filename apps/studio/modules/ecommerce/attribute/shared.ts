export interface IStudioAttribute {
  id: string;
  adminTitle: string;
  slug: string;
  string: Record<string, string>;
  variant: string;
  number?: string | null;
  boolean?: boolean | null;
  date?: string | null;
  datetime?: string | null;
}
export const studioAttributes: IStudioAttribute[] = [
  {
    id: "attribute_delivery",
    adminTitle: "Delivery window",
    slug: "delivery",
    string: { en: "2–4 weeks" },
    variant: "default",
  },
  {
    id: "attribute_support",
    adminTitle: "Included support",
    slug: "support",
    string: { en: "30 days" },
    variant: "default",
  },
  {
    id: "attribute_team",
    adminTitle: "Delivery team",
    slug: "team-size",
    string: { en: "2 specialists" },
    variant: "default",
  },
  {
    id: "attribute_format",
    adminTitle: "Delivery format",
    slug: "format",
    string: { en: "Source code and documentation" },
    variant: "default",
  },
];

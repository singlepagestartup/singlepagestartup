export interface IStudioProduct {
  id: string;
  adminTitle: string;
  title: Record<string, string>;
  shortDescription: Record<string, string>;
  description: Record<string, string>;
  slug: string;
  type: string;
  variant: string;
}
export const studioProducts: IStudioProduct[] = [
  {
    id: "product_website",
    adminTitle: "Website development",
    title: { en: "Website development", ru: "Разработка сайта" },
    shortDescription: {
      en: "A website for your business",
      ru: "Сайт для вашего бизнеса",
    },
    description: {
      en: "A composed website built from reusable modules.",
      ru: "Сайт из переиспользуемых модулей.",
    },
    slug: "website-development",
    type: "one_off",
    variant: "default",
  },
  {
    id: "product_design",
    adminTitle: "Design system sprint",
    title: { en: "Design system sprint", ru: "Дизайн-система" },
    shortDescription: {
      en: "Reusable interface foundations",
      ru: "Основа интерфейса",
    },
    description: {
      en: "A component catalogue and visual foundations.",
      ru: "Каталог компонентов и визуальные правила.",
    },
    slug: "design-system-sprint",
    type: "one_off",
    variant: "default",
  },
  {
    id: "product_support",
    adminTitle: "Support retainer",
    title: { en: "Support retainer", ru: "Поддержка" },
    shortDescription: {
      en: "Ongoing product support",
      ru: "Поддержка продукта",
    },
    description: {
      en: "Product maintenance and improvements.",
      ru: "Развитие и сопровождение продукта.",
    },
    slug: "support-retainer",
    type: "subscription",
    variant: "default",
  },
];

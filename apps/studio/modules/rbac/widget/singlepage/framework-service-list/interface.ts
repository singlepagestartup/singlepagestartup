export const variant = "framework-service-list" as const;
export interface IFrameworkService {
  slug: string;
  title: Record<"en" | "ru", string>;
  summary: Record<"en" | "ru", string>;
  description: Record<"en" | "ru", string>;
  price: string;
}

export interface IComponentProps {
  variant?: typeof variant;
  language?: "en" | "ru";
  services?: readonly IFrameworkService[];
  resolveLink?: (href: string) => string | { href: string; target: "_top" };
}
export interface IComponentPropsExtended extends IComponentProps {}

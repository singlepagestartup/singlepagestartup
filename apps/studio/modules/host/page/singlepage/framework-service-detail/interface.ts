export const variant = "framework-service-detail" as const;
export interface IComponentProps {
  variant?: typeof variant;
  language?: "en" | "ru";
  productSlug?: string;
}
export interface IComponentPropsExtended extends IComponentProps {}

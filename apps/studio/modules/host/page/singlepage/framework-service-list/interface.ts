export const variant = "framework-service-list" as const;
export interface IComponentProps {
  variant?: typeof variant;
  language?: "en" | "ru";
}
export interface IComponentPropsExtended extends IComponentProps {}

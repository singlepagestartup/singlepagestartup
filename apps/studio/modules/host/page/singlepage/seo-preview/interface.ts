export const variant = "seo-preview" as const;
export interface IComponentProps {
  variant?: typeof variant;
  templates?: Record<string, string | null | undefined>;
  values?: Record<string, unknown>;
  url?: string;
  language?: string;
  fallbackImage?: string;
  hidden?: boolean;
}
export interface IComponentPropsExtended extends IComponentProps {}

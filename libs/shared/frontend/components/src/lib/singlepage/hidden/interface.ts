export const variant = "hidden" as const;
export interface IComponentProps {
  variant: typeof variant;
  data?: unknown;
  isServer?: boolean;
  language?: string;
  dataSource?: "api" | "props";
}

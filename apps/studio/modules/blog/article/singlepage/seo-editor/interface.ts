import type { IEntityMetadata } from "@sps/shared-utils/metadata";
export const variant = "seo-editor" as const;
export interface IComponentProps {
  variant?: typeof variant;
  metadata?: IEntityMetadata;
  language?: string;
  onChange?: (value: IEntityMetadata) => void;
}

import type { IEntityMetadata } from "@sps/shared-utils/metadata";
export interface IComponentProps {
  value: IEntityMetadata;
  language?: string;
  onChange: (value: IEntityMetadata) => void;
  onValidityChange?: (valid: boolean) => void;
}

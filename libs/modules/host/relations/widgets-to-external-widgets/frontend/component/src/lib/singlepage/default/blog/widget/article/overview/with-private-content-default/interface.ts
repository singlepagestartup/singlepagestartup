import { ISpsComponentBase } from "@sps/ui-adapter";

export type IComponentProps = ISpsComponentBase & {
  language: string;
  url: string;
  variant: string;
};

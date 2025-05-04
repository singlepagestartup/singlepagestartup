import { ISpsComponentBase } from "@sps/ui-adapter";

export type IComponentProps = ISpsComponentBase & {
  url: string;
  language: string;
  variant: "subject-overview-default";
};

import { ISpsComponentBase } from "@sps/ui-adapter";

export type IComponentProps = ISpsComponentBase & {
  language: string;
  variant: "me-authentication-default";
};

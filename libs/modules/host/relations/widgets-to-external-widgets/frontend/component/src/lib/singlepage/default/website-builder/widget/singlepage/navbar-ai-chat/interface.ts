import type { ISpsComponentBase } from "@sps/ui-adapter";
import type { IModel } from "@sps/website-builder/models/widget/sdk/model";
export interface IComponentProps extends ISpsComponentBase {
  variant: "navbar-ai-chat";
  data: IModel;
  language: string;
  url: string;
}

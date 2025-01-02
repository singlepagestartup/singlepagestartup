import { ISpsComponentBase } from "@sps/ui-adapter";
import { IFindProps } from "@sps/shared-frontend-api";
import { UseFormReturn } from "react-hook-form";

export interface IComponentProps<M extends { id?: string }, V>
  extends ISpsComponentBase {
  variant: V;
  apiProps?: {
    params?: IFindProps["params"];
    options?: IFindProps["options"];
  };
  className?: string;
  formFieldName: string;
  form: UseFormReturn<any>;
  renderField?: keyof M;
}

export type IComponentPropsExtended<
  M extends { id?: string },
  V,
  IComponentProps,
> = IComponentProps & {
  data: M[];
};

import type { IComponentProps, CrmOptionDefaultProps } from "./interface";
export type { CrmOptionDefaultProps } from "./interface";
import {
  type CrmOptionRecord,
  defaultCrmOptions,
} from "../../../shared/demo-crm";

export const defaultCrmOptionDefaultProps: CrmOptionDefaultProps = {
  option: defaultCrmOptions[0],
};

export function CrmOptionDefault(props?: IComponentProps) {
  const { option } = {
    ...defaultCrmOptionDefaultProps,
    ...props,
  };

  return (
    <div
      className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-card p-5 text-left"
      data-ds-block="crm.option.default"
      data-ds-layer="singlepage"
      data-module="crm"
      data-model="option"
      data-variant={props?.variant ?? "default"}
    >
      <span className="text-sm font-medium text-foreground">
        {option.title}
      </span>
      {option.description ? (
        <span className="text-xs leading-5 text-muted-foreground">
          {option.description}
        </span>
      ) : null}
    </div>
  );
}

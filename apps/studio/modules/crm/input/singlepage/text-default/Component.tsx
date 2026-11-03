import type { IComponentProps, CrmInputTextDefaultProps } from "./interface";
export type { CrmInputTextDefaultProps } from "./interface";
import { type CrmInputRecord, defaultCrmForm } from "../../../shared/demo-crm";

export const defaultCrmInputTextDefaultProps: CrmInputTextDefaultProps = {
  input: defaultCrmForm.steps[0].inputs[0],
  disabled: false,
  namePrefix: "crm",
};

export function CrmInputTextDefault(props?: IComponentProps) {
  const { input, disabled, namePrefix } = {
    ...defaultCrmInputTextDefaultProps,
    ...props,
  };
  const inputId = `${namePrefix}-${input.slug}`;

  return (
    <label
      className="block min-w-0"
      data-ds-block="crm.input.text-default"
      data-ds-layer="singlepage"
      data-module="crm"
      data-model="input"
      data-variant={props?.variant ?? "text-default"}
    >
      <span className="mb-1 block text-sm font-medium text-foreground">
        {input.label}
        {input.required ? (
          <span className="ml-1 text-destructive">*</span>
        ) : null}
      </span>
      <input
        className="min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-foreground focus:ring-2 focus:ring-foreground disabled:bg-muted focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground"
        disabled={disabled}
        id={inputId}
        name={inputId}
        placeholder={input.placeholder}
        required={input.required}
        type={input.type ?? "text"}
      />
    </label>
  );
}

import type {
  IComponentProps,
  CrmInputTextareaDefaultProps,
} from "./interface";
export type { CrmInputTextareaDefaultProps } from "./interface";
import { type CrmInputRecord, defaultCrmForm } from "../../../shared/demo-crm";

export const defaultCrmInputTextareaDefaultProps: CrmInputTextareaDefaultProps =
  {
    input: defaultCrmForm.steps[1].inputs[2],
    disabled: false,
    namePrefix: "crm",
  };

export function CrmInputTextareaDefault(props?: IComponentProps) {
  const { input, disabled, namePrefix } = {
    ...defaultCrmInputTextareaDefaultProps,
    ...props,
  };
  const inputId = `${namePrefix}-${input.slug}`;

  return (
    <label
      className="block min-w-0"
      data-ds-block="crm.input.textarea-default"
      data-ds-layer="singlepage"
      data-module="crm"
      data-model="input"
      data-variant={props?.variant ?? "textarea-default"}
    >
      <span className="mb-1 block text-sm font-medium text-foreground">
        {input.label}
        {input.required ? (
          <span className="ml-1 text-destructive">*</span>
        ) : null}
      </span>
      <textarea
        className="min-h-28 w-full resize-y rounded-xl border border-border bg-card px-4 py-2 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-foreground focus:ring-2 focus:ring-foreground disabled:bg-muted focus-visible:border-foreground focus-visible:ring-2 focus-visible:ring-foreground"
        disabled={disabled}
        id={inputId}
        name={inputId}
        placeholder={input.placeholder}
        required={input.required}
      />
    </label>
  );
}

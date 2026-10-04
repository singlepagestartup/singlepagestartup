import type { CrmInputRecord } from "../../../../shared/demo-crm";
import { defaultCrmForm } from "../../../../shared/demo-crm";

export interface CrmInputTextareaDefaultProps {
  input: CrmInputRecord;
  disabled?: boolean;
  namePrefix?: string;
}

export const defaultCrmInputTextareaDefaultProps: CrmInputTextareaDefaultProps =
  {
    input: defaultCrmForm.steps[1].inputs[2],
    disabled: false,
    namePrefix: "crm",
  };

export function CrmInputTextareaDefault(
  props?: Partial<CrmInputTextareaDefaultProps>,
) {
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
    >
      <span className="mb-1 block text-sm font-medium text-[var(--workspace-brand-foreground)]">
        {input.label}
        {input.required ? (
          <span className="ml-1 text-[var(--workspace-brand-danger)]">*</span>
        ) : null}
      </span>
      <textarea
        className="min-h-28 w-full resize-y rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-4 py-2 text-base text-[var(--workspace-brand-foreground)] outline-none transition placeholder:text-[var(--workspace-brand-muted)] focus:border-[var(--workspace-brand-focus)] focus:ring-2 focus:ring-[var(--workspace-brand-focus)] disabled:bg-[var(--workspace-brand-background)] focus-visible:border-[var(--workspace-brand-focus)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-focus)]"
        disabled={disabled}
        id={inputId}
        name={inputId}
        placeholder={input.placeholder}
        required={input.required}
      />
    </label>
  );
}

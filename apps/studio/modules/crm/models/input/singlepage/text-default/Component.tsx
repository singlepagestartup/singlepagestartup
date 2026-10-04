import type { CrmInputRecord } from "../../../../shared/demo-crm";
import { defaultCrmForm } from "../../../../shared/demo-crm";

export interface CrmInputTextDefaultProps {
  input: CrmInputRecord;
  disabled?: boolean;
  namePrefix?: string;
}

export const defaultCrmInputTextDefaultProps: CrmInputTextDefaultProps = {
  input: defaultCrmForm.steps[0].inputs[0],
  disabled: false,
  namePrefix: "crm",
};

export function CrmInputTextDefault(props?: Partial<CrmInputTextDefaultProps>) {
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
    >
      <span className="mb-1 block text-sm font-medium text-[var(--workspace-brand-foreground)]">
        {input.label}
        {input.required ? (
          <span className="ml-1 text-[var(--workspace-brand-danger)]">*</span>
        ) : null}
      </span>
      <input
        className="min-h-12 w-full min-w-0 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-4 text-base text-[var(--workspace-brand-foreground)] outline-none transition placeholder:text-[var(--workspace-brand-muted)] focus:border-[var(--workspace-brand-focus)] focus:ring-2 focus:ring-[var(--workspace-brand-focus)] disabled:bg-[var(--workspace-brand-background)] focus-visible:border-[var(--workspace-brand-focus)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-focus)]"
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

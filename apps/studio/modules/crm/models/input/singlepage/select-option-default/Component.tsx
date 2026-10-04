import { Select } from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import type { CrmInputRecord } from "../../../../shared/demo-crm";
import { defaultCrmForm } from "../../../../shared/demo-crm";

export interface CrmInputSelectOptionDefaultProps {
  input: CrmInputRecord;
  disabled?: boolean;
  namePrefix?: string;
}

export const defaultCrmInputSelectOptionDefaultProps: CrmInputSelectOptionDefaultProps =
  {
    input: defaultCrmForm.steps[1].inputs[1],
    disabled: false,
    namePrefix: "crm",
  };

export function CrmInputSelectOptionDefault(
  props?: Partial<CrmInputSelectOptionDefaultProps>,
) {
  const { input, disabled, namePrefix } = {
    ...defaultCrmInputSelectOptionDefaultProps,
    ...props,
  };
  const inputId = `${namePrefix}-${input.slug}`;

  return (
    <label
      className="block"
      data-ds-block="crm.input.select-option-default"
      data-ds-layer="singlepage"
    >
      <span className="mb-1 block text-sm font-medium text-[var(--workspace-brand-foreground)]">
        {input.label}
        {input.required ? (
          <span className="ml-1 text-[var(--workspace-brand-danger)]">*</span>
        ) : null}
      </span>
      <Select
        className="min-h-12 text-base"
        placeholder={input.placeholder}
        disabled={disabled}
        id={inputId}
        name={inputId}
        required={input.required}
        options={(input.options ?? []).map((option) => ({
          value: option.value,
          label: option.title,
        }))}
      />
    </label>
  );
}

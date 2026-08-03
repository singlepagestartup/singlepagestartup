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
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {input.label}
        {input.required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      <select
        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
        defaultValue=""
        disabled={disabled}
        id={inputId}
        name={inputId}
        required={input.required}
      >
        <option disabled value="">
          {input.placeholder}
        </option>
        {(input.options ?? []).map((option) => (
          <option key={option.id} value={option.value}>
            {option.title}
          </option>
        ))}
      </select>
    </label>
  );
}

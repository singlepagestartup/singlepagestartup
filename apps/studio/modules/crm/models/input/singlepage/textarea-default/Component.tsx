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
      className="block"
      data-ds-block="crm.input.textarea-default"
      data-ds-layer="singlepage"
    >
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {input.label}
        {input.required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      <textarea
        className="min-h-28 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
        disabled={disabled}
        id={inputId}
        name={inputId}
        placeholder={input.placeholder}
        required={input.required}
      />
    </label>
  );
}

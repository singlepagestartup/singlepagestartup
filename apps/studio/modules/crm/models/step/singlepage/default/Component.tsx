import type {
  CrmInputRecord,
  CrmStepRecord,
} from "../../../../shared/demo-crm";
import { defaultCrmForm } from "../../../../shared/demo-crm";
import { CrmInputSelectOptionDefault } from "../../../input/singlepage/select-option-default/Component";
import { CrmInputTextDefault } from "../../../input/singlepage/text-default/Component";
import { CrmInputTextareaDefault } from "../../../input/singlepage/textarea-default/Component";

export interface CrmStepDefaultProps {
  step: CrmStepRecord;
  disabled?: boolean;
  namePrefix?: string;
}

export const defaultCrmStepDefaultProps: CrmStepDefaultProps = {
  step: defaultCrmForm.steps[0],
  disabled: false,
  namePrefix: "crm",
};

function CrmStepInput({
  disabled,
  input,
  namePrefix,
}: {
  disabled?: boolean;
  input: CrmInputRecord;
  namePrefix: string;
}) {
  if (input.variant === "textarea-default") {
    return (
      <CrmInputTextareaDefault
        disabled={disabled}
        input={input}
        namePrefix={namePrefix}
      />
    );
  }

  if (input.variant === "select-option-default") {
    return (
      <CrmInputSelectOptionDefault
        disabled={disabled}
        input={input}
        namePrefix={namePrefix}
      />
    );
  }

  return (
    <CrmInputTextDefault
      disabled={disabled}
      input={input}
      namePrefix={namePrefix}
    />
  );
}

export function CrmStepDefault(props?: Partial<CrmStepDefaultProps>) {
  const { step, disabled, namePrefix } = {
    ...defaultCrmStepDefaultProps,
    ...props,
  };

  return (
    <fieldset
      className="rounded-xl border border-slate-200 bg-white p-5"
      data-ds-block="crm.step.default"
      data-ds-layer="singlepage"
    >
      <legend className="px-1 text-base font-semibold text-slate-950">
        {step.title}
      </legend>
      <p className="mb-4 mt-1 text-sm leading-6 text-slate-500">
        {step.description}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {step.inputs.map((input) => (
          <div
            className={
              input.variant === "textarea-default" ? "sm:col-span-2" : ""
            }
            key={input.id}
          >
            <CrmStepInput
              disabled={disabled}
              input={input}
              namePrefix={`${namePrefix}-${step.id}`}
            />
          </div>
        ))}
      </div>
    </fieldset>
  );
}

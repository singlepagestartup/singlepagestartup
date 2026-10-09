import type { CrmInputRecord, CrmStepRecord } from "../../../shared/demo-crm";
import { defaultCrmForm } from "../../../shared/demo-crm";
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
      className="min-w-0 rounded-2xl bg-[var(--workspace-brand-background)] p-5 sm:p-6"
      data-ds-block="crm.step.default"
      data-ds-layer="singlepage"
    >
      <legend className="sr-only">{step.title}</legend>
      <h2 className="mb-5 text-lg font-semibold text-[var(--workspace-brand-foreground)]">
        {step.title}
      </h2>
      <div className="grid min-w-0 gap-5 sm:grid-cols-2">
        {step.inputs.map((input) => (
          <div
            className={
              input.variant === "textarea-default"
                ? "min-w-0 sm:col-span-2"
                : "min-w-0"
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

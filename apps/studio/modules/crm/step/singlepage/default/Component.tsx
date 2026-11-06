import type { IComponentProps, CrmStepDefaultProps } from "./interface";
export type { CrmStepDefaultProps } from "./interface";
import { Component as Input } from "../../../input/index";
import {
  type CrmInputRecord,
  type CrmStepRecord,
  defaultCrmForm,
} from "../../../shared/demo-crm";

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
      <Input
        variant="textarea-default"
        disabled={disabled}
        input={input}
        namePrefix={namePrefix}
      />
    );
  }

  if (input.variant === "select-option-default") {
    return (
      <Input
        variant="select-option-default"
        disabled={disabled}
        input={input}
        namePrefix={namePrefix}
      />
    );
  }

  return (
    <Input
      variant="text-default"
      disabled={disabled}
      input={input}
      namePrefix={namePrefix}
    />
  );
}

export function CrmStepDefault(props?: IComponentProps) {
  const { step, disabled, namePrefix } = {
    ...defaultCrmStepDefaultProps,
    ...props,
  };

  return (
    <fieldset
      className="min-w-0 rounded-2xl bg-muted p-5 sm:p-6"
      data-ds-block="crm.step.default"
      data-ds-layer="singlepage"
      data-module="crm"
      data-model="step"
      data-variant={props?.variant ?? "default"}
    >
      <legend className="sr-only">{step.title}</legend>
      <h2 className="mb-5 text-lg font-semibold text-foreground">
        {step.title}
      </h2>
      {step.description ? (
        <p className="mb-5 text-sm leading-6 text-muted-foreground">
          {step.description}
        </p>
      ) : null}
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

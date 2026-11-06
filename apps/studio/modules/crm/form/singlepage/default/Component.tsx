import type { IComponentProps, CrmFormDefaultProps } from "./interface";
export type { CrmFormDefaultProps } from "./interface";
import { Component as WebsiteBuilderModuleButton } from "../../../../website-builder/button/index";
import {
  forwardRef as forwardRefControl,
  type ButtonHTMLAttributes as ButtonControlProps,
  useState,
} from "react";
import { Component as Step } from "../../../step/index";
import { type CrmFormRecord, defaultCrmForm } from "../../../shared/demo-crm";

export function CrmFormDefault(props?: IComponentProps) {
  const { form, disabled, embedded } = {
    ...defaultCrmFormDefaultProps,
    ...props,
  };
  const [submitted, setSubmitted] = useState(false);
  const [invalid, setInvalid] = useState(false);
  return (
    <form
      className={
        embedded
          ? "min-w-0 w-full"
          : "mx-auto w-full max-w-3xl rounded-3xl border border-border bg-card p-6 sm:p-8"
      }
      data-ds-block="crm.form.default"
      data-ds-layer="singlepage"
      onInvalidCapture={() => {
        setInvalid(true);
        setSubmitted(false);
      }}
      onSubmit={(event) => {
        event.preventDefault();
        setInvalid(false);
        setSubmitted(true);
      }}
      data-module="crm"
      data-model="form"
      data-variant={props?.variant ?? "default"}
    >
      <div className="mb-6">
        <h2 className=" text-2xl font-semibold text-foreground">
          {form.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {form.description}
        </p>
      </div>
      <div className="space-y-8">
        {form.steps.map((step) => (
          <Step
            variant="default"
            disabled={disabled}
            key={step.id}
            namePrefix={form.id}
            step={step}
          />
        ))}
      </div>
      <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {invalid ? (
            <p role="alert" className="text-sm text-destructive">
              Complete the required fields and check your email address.
            </p>
          ) : null}
          {submitted ? (
            <p role="status" className="text-sm font-medium text-foreground">
              {form.successLabel}
            </p>
          ) : null}
        </div>
        <Button disabled={disabled} type="submit">
          {form.submitLabel}
        </Button>
      </div>
    </form>
  );
}
const Button = forwardRefControl<
  HTMLButtonElement,
  ButtonControlProps<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "plain" | "danger";
  }
>(function Button({ variant = "primary", ...props }, ref) {
  return (
    <WebsiteBuilderModuleButton
      {...props}
      variant="control"
      appearance={variant}
      ref={ref}
    />
  );
});
export const defaultCrmFormDefaultProps: CrmFormDefaultProps = {
  form: defaultCrmForm,
  disabled: false,
  subjectName: "Your account",
};

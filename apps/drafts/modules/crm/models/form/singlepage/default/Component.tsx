import { useState } from "react";

import type { CrmFormRecord } from "../../../../shared/demo-crm";
import { defaultCrmForm } from "../../../../shared/demo-crm";
import { CrmStepDefault } from "../../../step/singlepage/default/Component";

export interface CrmFormDefaultProps {
  form: CrmFormRecord;
  disabled?: boolean;
  subjectName?: string;
}

export const defaultCrmFormDefaultProps: CrmFormDefaultProps = {
  form: defaultCrmForm,
  disabled: false,
  subjectName: "Current subject",
};

export function CrmFormDefault(props?: Partial<CrmFormDefaultProps>) {
  const { form, disabled, subjectName } = {
    ...defaultCrmFormDefaultProps,
    ...props,
  };
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      className="rounded-xl border border-slate-200 bg-white p-6"
      data-ds-block="crm.form.default"
      data-ds-layer="singlepage"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          CRM Form
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-950">
          {form.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {form.description}
        </p>
        {subjectName ? (
          <p className="mt-3 text-sm text-slate-500">
            Request owner:{" "}
            <span className="font-medium text-slate-700">{subjectName}</span>
          </p>
        ) : null}
      </div>
      <div className="space-y-5">
        {form.steps.map((step) => (
          <CrmStepDefault
            disabled={disabled}
            key={step.id}
            namePrefix={form.id}
            step={step}
          />
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {submitted ? (
          <p className="text-sm font-medium text-emerald-700">
            {form.successLabel}
          </p>
        ) : (
          <p className="text-sm text-slate-500">
            The request will be attached to the current RBAC subject.
          </p>
        )}
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300"
          disabled={disabled}
          type="submit"
        >
          {form.submitLabel}
        </button>
      </div>
    </form>
  );
}

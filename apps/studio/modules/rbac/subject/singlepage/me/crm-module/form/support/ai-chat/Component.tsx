"use client";
import type { IComponentProps, ISubjectSupportProps } from "./interface";
export type { ISubjectSupportProps } from "./interface";

import { Component as SharedIcon } from "../../../../../../../../shared/icon";

import { useCallback, useId, useRef, useState, type FormEvent } from "react";
import {
  Component as CrmModuleForm,
  type ISupportFormCopy,
} from "../../../../../../../../crm/form";

import defaultCopy from "./content.json";

export function Component({
  variant = "me-crm-module-form-support-ai-chat",
  formCopy,
  projectHref = "/ai-chat/social/profiles/create",
}: IComponentProps = {}) {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState({ topic: "", details: "", result: "" });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof values, string>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const change = useCallback((field: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }, []);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    for (const field of ["topic", "details", "result"] as const)
      if (!values[field].trim())
        next[field] = defaultCopy.labels[`${field}-error`];
    setErrors(next);
    const invalid = Object.keys(next)[0];
    if (invalid)
      form.current?.querySelector<HTMLElement>(`[name="${invalid}"]`)?.focus();
    else setSubmitted(true);
  }
  return (
    <form
      ref={form}
      onSubmit={submit}
      noValidate
      data-module="rbac"
      data-model="subject"
      data-variant={variant}
    >
      <CrmModuleForm
        variant="support-ai-chat"
        id={id}
        values={values}
        errors={errors}
        onChange={change}
        copy={formCopy}
        submitted={submitted}
      >
        {submitted ? (
          <div className="grid gap-5">
            <p
              role="status"
              className="rounded-xl border border-border bg-muted p-4 text-sm"
            >
              {defaultCopy.labels["success-message"]}
            </p>
            {defaultCopy.successParagraphs.map((text) => (
              <p key={text} className="text-sm leading-6 text-muted-foreground">
                {text}
              </p>
            ))}
            <dl className="grid gap-4 rounded-xl bg-muted p-4">
              {Object.entries(values).map(([field, value]) => (
                <div key={field}>
                  <dt className="text-sm font-semibold capitalize">{field}</dt>
                  <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="min-h-11 rounded-xl border border-border px-5 text-sm font-semibold"
              >
                {defaultCopy.labels["edit-request"]}
              </button>
              <a
                href={defaultCopy.labels["return-href"].replace(
                  "/ai-chat/social/profiles/example",
                  projectHref,
                )}
                className="inline-flex min-h-11 items-center rounded-xl px-5 text-sm font-semibold"
              >
                {defaultCopy.labels["return-label"]}
              </a>
            </div>
          </div>
        ) : (
          <button
            type="submit"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            <SharedIcon variant="phosphor" name="paper-plane-tilt" />
            {defaultCopy.labels.submit}
          </button>
        )}
      </CrmModuleForm>
    </form>
  );
}

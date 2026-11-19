import { cloneElement, useId, type ReactElement } from "react";
import { fieldClass } from "../primitives";

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactElement<{ id?: string; "aria-describedby"?: string }>;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="grid min-w-0 content-start gap-1.5 text-sm font-medium">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, {
        id,
        "aria-describedby": hint ? `${id}-hint` : undefined,
      })}
      {hint && (
        <p
          id={`${id}-hint`}
          className="text-xs leading-5 font-normal text-muted-foreground"
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  multiline = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <Field label={label}>
      {multiline ? (
        <textarea
          className={`${fieldClass} min-h-18`}
          required={required}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      ) : (
        <input
          className={fieldClass}
          required={required}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      )}
    </Field>
  );
}

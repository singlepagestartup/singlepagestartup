import { settingsFormStyles } from "@sps/shared-ui-shadcn";
import { cloneElement, useId, type ReactElement } from "react";

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
    <div className={`${settingsFormStyles.label} content-start`}>
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
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  required?: boolean;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {multiline ? (
        <textarea
          className={settingsFormStyles.textarea}
          required={required}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      ) : (
        <input
          className={settingsFormStyles.field}
          required={required}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      )}
    </Field>
  );
}

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
  const fieldId = useId();
  const hintId = hint ? `${fieldId}-hint` : undefined;
  return (
    <div className="grid content-start gap-1.5 text-sm font-medium">
      <label htmlFor={fieldId}>{label}</label>
      {cloneElement(children, { id: fieldId, "aria-describedby": hintId })}
      {hint && (
        <span
          id={hintId}
          className="text-xs leading-5 font-normal text-muted-foreground"
        >
          {hint}
        </span>
      )}
    </div>
  );
}

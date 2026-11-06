import type { IComponentProps, ISupportInputProps } from "./interface";
export type { ISupportInputProps } from "./interface";
import { useId } from "react";

export function Component({
  variant = "support-ai-chat",
  id: suppliedId,
  name,
  label,
  placeholder,
  value,
  error,
  options,
  onChange,
}: IComponentProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const attributes = {
    id,
    name,
    value,
    required: true,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
    className:
      "min-h-12 w-full min-w-0 rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground aria-invalid:border-destructive",
  };
  return (
    <div
      className="grid min-w-0 gap-2"
      data-module="crm"
      data-model="input"
      data-variant={variant}
    >
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {options ? (
        <select
          {...attributes}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <textarea
          {...attributes}
          placeholder={placeholder}
          rows={name === "details" ? 5 : 4}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

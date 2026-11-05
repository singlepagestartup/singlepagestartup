import type { IComponentProps, ISupportStepProps } from "./interface";
export type { ISupportStepProps } from "./interface";
import { Component as Input } from "../../../../input";

export function Component({
  variant = "support-ai-chat",
  id,
  fields,
  topics,
  values,
  errors,
  onChange,
}: IComponentProps) {
  return (
    <fieldset
      className="grid min-w-0 gap-5"
      data-module="crm"
      data-model="step"
      data-variant={variant}
    >
      <legend className="sr-only">Подробности обращения</legend>
      {(["topic", "details", "result"] as const).map((field) => (
        <Input
          key={field}
          id={`${id}-${field}`}
          name={field}
          {...fields[field]}
          value={values[field]}
          error={errors?.[field]}
          options={field === "topic" ? topics : undefined}
          onChange={(value) => onChange(field, value)}
          variant="support-ai-chat"
        />
      ))}
    </fieldset>
  );
}

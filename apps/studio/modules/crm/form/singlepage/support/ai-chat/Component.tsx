import type {
  IComponentProps,
  ISupportFormCopy,
  ISupportFormProps,
} from "./interface";
export type { ISupportFormCopy, ISupportFormProps } from "./interface";
import type { ReactNode } from "react";
import { Component as Step, type ISupportStepProps } from "../../../../step";
import defaultCopy from "./content.json";

export function Component({
  variant = "support-ai-chat",
  copy = defaultCopy,
  submitted,
  children,
  ...fields
}: IComponentProps) {
  return (
    <div
      className="min-w-0"
      data-module="crm"
      data-model="form"
      data-variant={variant}
    >
      {!submitted && (
        <Step
          {...fields}
          fields={copy.fields}
          topics={copy.topics}
          variant="support-ai-chat"
        />
      )}
      <div className="mt-5">{children}</div>
    </div>
  );
}

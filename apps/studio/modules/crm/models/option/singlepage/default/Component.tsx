import type { CrmOptionRecord } from "../../../../shared/demo-crm";
import { defaultCrmOptions } from "../../../../shared/demo-crm";

export interface CrmOptionDefaultProps {
  option: CrmOptionRecord;
}

export const defaultCrmOptionDefaultProps: CrmOptionDefaultProps = {
  option: defaultCrmOptions[0],
};

export function CrmOptionDefault(props?: Partial<CrmOptionDefaultProps>) {
  const { option } = {
    ...defaultCrmOptionDefaultProps,
    ...props,
  };

  return (
    <div
      className="flex w-full flex-col gap-2 rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-5 text-left"
      data-ds-block="crm.option.default"
      data-ds-layer="singlepage"
    >
      <span className="text-sm font-medium text-[var(--workspace-brand-foreground)]">
        {option.title}
      </span>
      {option.description ? (
        <span className="text-xs leading-5 text-[var(--workspace-brand-muted)]">
          {option.description}
        </span>
      ) : null}
    </div>
  );
}

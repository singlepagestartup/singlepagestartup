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
      className="flex w-full flex-col gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left"
      data-ds-block="crm.option.default"
      data-ds-layer="singlepage"
    >
      <span className="text-sm font-medium text-slate-950">{option.title}</span>
      {option.description ? (
        <span className="text-xs leading-5 text-slate-500">
          {option.description}
        </span>
      ) : null}
    </div>
  );
}

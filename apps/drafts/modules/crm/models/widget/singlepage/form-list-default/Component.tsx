import {
  defaultCrmForm,
  type CrmFormRecord,
} from "../../../../shared/demo-crm";
import { CrmFormDefault } from "../../../form/singlepage/default/Component";

export interface CrmWidgetFormListDefaultProps {
  eyebrow: string;
  title: string;
  description: string;
  form: CrmFormRecord;
  subjectName?: string;
}

export const defaultCrmWidgetFormListDefaultProps: CrmWidgetFormListDefaultProps =
  {
    eyebrow: "CRM Module",
    title: "Create request",
    description:
      "Subject-owned CRM composition that renders a CRM form, its steps, and its inputs.",
    form: defaultCrmForm,
    subjectName: "Current subject",
  };

export function CrmWidgetFormListDefault(
  props?: Partial<CrmWidgetFormListDefaultProps>,
) {
  const { eyebrow, title, description, form, subjectName } = {
    ...defaultCrmWidgetFormListDefaultProps,
    ...props,
  };

  return (
    <section
      className="space-y-5"
      data-ds-block="crm.widget.form-list-default"
      data-ds-layer="singlepage"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
      <CrmFormDefault form={form} subjectName={subjectName} />
    </section>
  );
}

import type { CrmFormRecord } from "../../../../../crm/shared/demo-crm";
import { defaultCrmForm } from "../../../../../crm/shared/demo-crm";
import { CrmWidgetFormListDefault } from "../../../../../crm/models/widget/singlepage/form-list-default/Component";

export const defaultSubjectMeCrmFormDefaultProps = {
  subject: {
    id: "rbac-subject-current",
    name: "Current subject",
    email: "subject@sps.dev",
  },
  title: "Subject CRM request",
  description:
    "RBAC subject wrapper that composes CRM-owned form, step, input, and option models.",
  crmForm: defaultCrmForm,
};

export interface SubjectMeCrmFormDefaultProps {
  subject: {
    id: string;
    name: string;
    email: string;
  };
  title: string;
  description: string;
  crmForm: CrmFormRecord;
}

export function SubjectMeCrmFormDefault(
  props?: Partial<SubjectMeCrmFormDefaultProps>,
) {
  const { subject, title, description, crmForm } = {
    ...defaultSubjectMeCrmFormDefaultProps,
    ...props,
  };

  return (
    <section
      className="rounded-xl border border-slate-200 bg-slate-50 p-5"
      data-ds-block="rbac.subject.me-crm-form-deafult"
      data-ds-layer="singlepage"
    >
      <div className="mb-5 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          RBAC Subject
        </p>
        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
          <div className="text-sm text-slate-500">
            <p className="font-medium text-slate-900">{subject.name}</p>
            <p>{subject.email}</p>
          </div>
        </div>
      </div>
      <CrmWidgetFormListDefault form={crmForm} subjectName={subject.name} />
    </section>
  );
}

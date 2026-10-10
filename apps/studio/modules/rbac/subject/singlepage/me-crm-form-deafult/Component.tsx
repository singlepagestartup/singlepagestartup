import { Component as CrmModuleWidget } from "../../../../crm/widget";
import type { CrmFormRecord } from "../../../../crm/shared/demo-crm";
import { defaultCrmForm } from "../../../../crm/shared/demo-crm";

export const defaultSubjectMeCrmFormDefaultProps = {
  subject: {
    id: "rbac-subject-current",
    name: "Current subject",
    email: "subject@sps.dev",
  },
  title: defaultCrmForm.title,
  description: "Tell us what you need and how we can contact you.",
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
  embedded?: boolean;
}

export function SubjectMeCrmFormDefault(
  props?: Partial<SubjectMeCrmFormDefaultProps>,
) {
  const { subject, title, description, crmForm, embedded } = {
    ...defaultSubjectMeCrmFormDefaultProps,
    ...props,
  };

  return (
    <section
      className={
        embedded
          ? "min-w-0"
          : "rounded-3xl bg-[var(--workspace-brand-background)] p-4 sm:p-6"
      }
      data-ds-block="rbac.subject.me-crm-form-deafult"
      data-ds-layer="singlepage"
      data-subject-id={subject.id}
    >
      <CrmModuleWidget
        variant="form-list-default"
        title={title}
        description={description}
        form={crmForm}
        subjectName={subject.name}
        embedded={embedded}
      />
    </section>
  );
}

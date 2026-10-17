import type {
  IComponentProps,
  SubjectMeCrmFormDefaultProps,
} from "./interface";
export type { SubjectMeCrmFormDefaultProps } from "./interface";
import { Component as CrmModuleWidget } from "../../../../crm/widget/index";
import {
  type CrmFormRecord,
  defaultCrmForm,
} from "../../../../crm/shared/demo-crm";

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

export function SubjectMeCrmFormDefault(props?: IComponentProps) {
  const { subject, title, description, crmForm, embedded } = {
    ...defaultSubjectMeCrmFormDefaultProps,
    ...props,
  };

  return (
    <section
      className={embedded ? "min-w-0" : "rounded-3xl bg-muted p-4 sm:p-6"}
      data-ds-block="rbac.subject.me-crm-module-form-default"
      data-ds-layer="singlepage"
      data-subject-id={subject.id}
      data-module="rbac"
      data-model="subject"
      data-variant={props?.variant ?? "me-crm-module-form-default"}
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

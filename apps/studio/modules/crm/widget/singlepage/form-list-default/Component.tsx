import { Component as CrmModuleForm } from "../../../form";
import { defaultCrmForm, type CrmFormRecord } from "../../../shared/demo-crm";

export interface CrmWidgetFormListDefaultProps {
  eyebrow: string;
  title: string;
  description: string;
  form: CrmFormRecord;
  subjectName?: string;
  embedded?: boolean;
}

export const defaultCrmWidgetFormListDefaultProps: CrmWidgetFormListDefaultProps =
  {
    eyebrow: "Requests",
    title: defaultCrmForm.title,
    description: "Tell us what you need and how we can contact you.",
    form: defaultCrmForm,
    subjectName: "Your account",
  };

export function CrmWidgetFormListDefault(
  props?: Partial<CrmWidgetFormListDefaultProps>,
) {
  const { form, subjectName, embedded } = {
    ...defaultCrmWidgetFormListDefaultProps,
    ...props,
  };

  return (
    <section
      className="space-y-8"
      data-ds-block="crm.widget.form-list-default"
      data-ds-layer="singlepage"
    >
      <CrmModuleForm
        variant="default"
        form={{
          ...form,
          title: props?.title ?? form.title,
          description: props?.description ?? form.description,
        }}
        subjectName={subjectName}
        embedded={embedded}
      />
    </section>
  );
}

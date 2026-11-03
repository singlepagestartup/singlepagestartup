import type {
  IComponentProps,
  CrmWidgetFormListDefaultProps,
} from "./interface";
export type { CrmWidgetFormListDefaultProps } from "./interface";
import { Component as Form } from "../../../form/index";
import { defaultCrmForm, type CrmFormRecord } from "../../../shared/demo-crm";

export const defaultCrmWidgetFormListDefaultProps: CrmWidgetFormListDefaultProps =
  {
    eyebrow: "Requests",
    title: defaultCrmForm.title,
    description: "Tell us what you need and how we can contact you.",
    form: defaultCrmForm,
    subjectName: "Your account",
  };

export function CrmWidgetFormListDefault(props?: IComponentProps) {
  const { form, subjectName, embedded } = {
    ...defaultCrmWidgetFormListDefaultProps,
    ...props,
  };

  return (
    <section
      className="space-y-8"
      data-ds-block="crm.widget.form-list-default"
      data-ds-layer="singlepage"
      data-module="crm"
      data-model="widget"
      data-variant={props?.variant ?? "form-list-default"}
    >
      <Form
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

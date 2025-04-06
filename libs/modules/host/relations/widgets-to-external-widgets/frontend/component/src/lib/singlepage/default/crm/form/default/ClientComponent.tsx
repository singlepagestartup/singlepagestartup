"use client";

import { ISpsComponentBase } from "@sps/ui-adapter";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { IModel as IForm } from "@sps/crm/models/form/sdk/model";

export function Component(
  props: ISpsComponentBase & {
    form: IForm;
    language: string;
  },
) {
  return (
    <RbacSubject isServer={false} variant="authentication-me-default">
      {({ data: subject }) => {
        if (!subject) {
          return <></>;
        }

        return (
          <RbacSubject
            isServer={false}
            variant="crm-form"
            data={subject}
            form={props.form}
            language={props.language}
          />
        );
      }}
    </RbacSubject>
  );
}

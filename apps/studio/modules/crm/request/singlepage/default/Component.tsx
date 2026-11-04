import type { IComponentProps, CrmRequestDefaultProps } from "./interface";
export type { CrmRequestDefaultProps } from "./interface";
import {
  type CrmRequestRecord,
  defaultCrmRequest,
} from "../../../shared/demo-crm";

export const defaultCrmRequestDefaultProps: CrmRequestDefaultProps = {
  request: defaultCrmRequest,
};

export function CrmRequestDefault(props?: IComponentProps) {
  const { request } = {
    ...defaultCrmRequestDefaultProps,
    ...props,
  };

  return (
    <article
      className="rounded-2xl border border-border bg-card p-6"
      data-ds-block="crm.request.default"
      data-ds-layer="singlepage"
      data-module="crm"
      data-model="request"
      data-variant={props?.variant ?? "default"}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className=" text-xl font-semibold text-foreground">
            {request.formTitle}
          </h3>
        </div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
          {request.status}
        </span>
      </div>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Account</dt>
          <dd className="mt-1 font-medium text-foreground">
            {request.subjectName}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Created</dt>
          <dd className="mt-1 font-medium text-foreground">
            {request.createdAt}
          </dd>
        </div>
      </dl>
      <p className="mt-5 text-sm leading-6 text-muted-foreground">
        {request.summary}
      </p>
    </article>
  );
}

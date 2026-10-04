import type { CrmRequestRecord } from "../../../../shared/demo-crm";
import { defaultCrmRequest } from "../../../../shared/demo-crm";

export interface CrmRequestDefaultProps {
  request: CrmRequestRecord;
}

export const defaultCrmRequestDefaultProps: CrmRequestDefaultProps = {
  request: defaultCrmRequest,
};

export function CrmRequestDefault(props?: Partial<CrmRequestDefaultProps>) {
  const { request } = {
    ...defaultCrmRequestDefaultProps,
    ...props,
  };

  return (
    <article
      className="rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-6"
      data-ds-block="crm.request.default"
      data-ds-layer="singlepage"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className=" text-xl font-semibold text-[var(--workspace-brand-foreground)]">
            {request.formTitle}
          </h3>
        </div>
        <span className="rounded-full bg-[var(--workspace-brand-background)] px-3 py-1 text-xs font-medium text-[var(--workspace-brand-foreground)]">
          {request.status}
        </span>
      </div>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[var(--workspace-brand-muted)]">Account</dt>
          <dd className="mt-1 font-medium text-[var(--workspace-brand-foreground)]">
            {request.subjectName}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--workspace-brand-muted)]">Created</dt>
          <dd className="mt-1 font-medium text-[var(--workspace-brand-foreground)]">
            {request.createdAt}
          </dd>
        </div>
      </dl>
      <p className="mt-5 text-sm leading-6 text-[var(--workspace-brand-muted)]">
        {request.summary}
      </p>
    </article>
  );
}

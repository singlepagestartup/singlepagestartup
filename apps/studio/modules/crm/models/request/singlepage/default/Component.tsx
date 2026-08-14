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
      className="rounded-xl border border-slate-200 bg-white p-5"
      data-ds-block="crm.request.default"
      data-ds-layer="singlepage"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            CRM Request
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">
            {request.formTitle}
          </h3>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
          {request.status}
        </span>
      </div>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-400">Subject</dt>
          <dd className="mt-1 font-medium text-slate-900">
            {request.subjectName}
          </dd>
        </div>
        <div>
          <dt className="text-slate-400">Created</dt>
          <dd className="mt-1 font-medium text-slate-900">
            {request.createdAt}
          </dd>
        </div>
      </dl>
      <p className="mt-5 text-sm leading-6 text-slate-600">{request.summary}</p>
    </article>
  );
}

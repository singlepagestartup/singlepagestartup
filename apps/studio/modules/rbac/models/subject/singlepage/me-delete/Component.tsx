import { Trash2 } from "lucide-react";

export interface SubjectMeDeleteProps {
  title: string;
  description: string;
  actionLabel: string;
}

export const defaultSubjectMeDeleteProps: SubjectMeDeleteProps = {
  title: "Danger Zone",
  description:
    "Account removal is represented as a draft action only. Real RBAC checks and destructive effects are handled outside this prototype layer.",
  actionLabel: "Delete account",
};

export function SubjectMeDelete(props?: Partial<SubjectMeDeleteProps>) {
  const { title, description, actionLabel } = {
    ...defaultSubjectMeDeleteProps,
    ...props,
  };

  return (
    <article
      className="rounded-xl border border-red-200 bg-red-50 p-5"
      data-ds-block="rbac.subject.me-delete"
      data-ds-layer="singlepage"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium text-red-950">{title}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-red-700">
            {description}
          </p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm text-red-700 transition hover:bg-red-100"
          type="button"
        >
          <Trash2 className="h-4 w-4" />
          {actionLabel}
        </button>
      </div>
    </article>
  );
}

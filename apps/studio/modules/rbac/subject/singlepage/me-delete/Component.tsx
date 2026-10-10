import { useState } from "react";
import { Button } from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import { ConfirmationDialog } from "../../../../../workspace/design/singlepage/interface-kit/Confirmation";
import { Trash2 } from "../../../../../workspace/utils/components/ModuleIcons";
import { defaultRbacSubject, type RbacSubject } from "../../../shared";

export interface SubjectMeDeleteProps {
  title: string;
  description: string;
  actionLabel: string;
  subject: RbacSubject;
}

export const defaultSubjectMeDeleteProps: SubjectMeDeleteProps = {
  title: "Danger Zone",
  description:
    "This preview shows the account removal action. It does not delete your account.",
  actionLabel: "Delete account",
  subject: defaultRbacSubject,
};

export function SubjectMeDelete(props?: Partial<SubjectMeDeleteProps>) {
  const { title, description, actionLabel, subject } = {
    ...defaultSubjectMeDeleteProps,
    ...props,
  };
  const [pendingSubject, setPendingSubject] = useState<RbacSubject | null>(
    null,
  );
  const [result, setResult] = useState("");
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );

  return (
    <article
      ref={setPortalContainer}
      className="rounded-2xl border border-[var(--workspace-brand-danger-line)] bg-[var(--workspace-brand-danger-surface)] p-6"
      data-ds-block="rbac.subject.me-delete"
      data-ds-layer="singlepage"
      data-subject-id={subject.id}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--workspace-brand-danger)]">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--workspace-brand-danger)]">
            {description}
          </p>
        </div>
        <Button
          variant="danger"
          onClick={() => setPendingSubject(subject)}
          type="button"
        >
          <Trash2 className="h-5 w-5" />
          {actionLabel}
        </Button>
      </div>
      {result ? (
        <p
          role="status"
          className="mt-4 text-sm leading-6 text-[var(--workspace-brand-danger)]"
        >
          {result}
        </p>
      ) : null}
      <ConfirmationDialog
        open={pendingSubject !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSubject(null);
        }}
        title="Delete account?"
        description={`Confirm deletion of the current account (${pendingSubject?.slug ?? subject.slug}). This preview records the request without deleting any server data.`}
        confirmLabel={actionLabel}
        onConfirm={() => {
          if (!pendingSubject) return;
          setResult(
            `Account deletion requested for ${pendingSubject.slug} in this preview. No server data was changed.`,
          );
          setPendingSubject(null);
        }}
        portalContainer={portalContainer}
      />
    </article>
  );
}

import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  accountSubject,
  accountIdentities as initialIdentities,
  accountSubjectsToIdentities as initialSubjectsToIdentities,
  accountSocialProfiles,
  accountSubjectsToSocialProfiles,
  formatDateTime,
  getLocalizedValue,
  getIdentityProviderMeta,
  getIdentityActions,
  getIdentityPrimaryLogin,
  getIdentityOperationConfirm,
  AccountIdentity,
  SubjectToIdentity,
} from "../data";
import { cn } from "../../lib/utils";
import { ExternalLink, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

type OperationStatus = "idle" | "success" | "error";

interface IdentityOperationState {
  status: OperationStatus;
  operationKey: string;
  message: string;
}

interface LastOperation {
  status: OperationStatus;
  message: string;
}

function getStatusText(status: OperationStatus) {
  if (status === "success") return "Success";
  if (status === "error") return "Error";
  return "Idle";
}

function CopyIdButton({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      navigator.clipboard.writeText(value);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    },
    [value],
  );

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "mt-0.5 block w-fit max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border px-2 py-1 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100",
        copied
          ? "border-emerald-500 bg-emerald-100 text-emerald-700"
          : "border-slate-300 bg-white",
        className,
      )}
      title={value}
    >
      {value}
    </button>
  );
}

export function AccountSettingsPage() {
  const navigate = useNavigate();
  const [identities, setIdentities] = useState<AccountIdentity[]>([
    ...initialIdentities,
  ]);
  const [subjectsToIdentities, setSubjectsToIdentities] = useState<
    SubjectToIdentity[]
  >([...initialSubjectsToIdentities]);
  const [identityOperations, setIdentityOperations] = useState<
    Record<string, IdentityOperationState>
  >({});
  const [lastOperation, setLastOperation] = useState<LastOperation | null>(
    null,
  );

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    actionType: string;
    title: string;
    description: string;
    confirmLabel: string;
    payload: any;
  }>({
    open: false,
    actionType: "",
    title: "",
    description: "",
    confirmLabel: "",
    payload: null,
  });

  const openConfirm = (config: Omit<typeof confirmDialog, "open">) => {
    setConfirmDialog({ ...config, open: true });
  };

  const closeConfirm = () => {
    setConfirmDialog({
      open: false,
      actionType: "",
      title: "",
      description: "",
      confirmLabel: "",
      payload: null,
    });
  };

  const handleIdentityAction = (identityId: string, operationKey: string) => {
    const identity = identities.find((i) => i.id === identityId);
    if (!identity) return;

    const confirmConfig = getIdentityOperationConfirm(identity, operationKey);

    openConfirm({
      actionType:
        operationKey === "delete" ? "identity-delete" : "identity-operation",
      title: confirmConfig.title,
      description: confirmConfig.description,
      confirmLabel: confirmConfig.confirmLabel,
      payload: { identityId, operationKey },
    });
  };

  const executeConfirm = () => {
    const { actionType, payload } = confirmDialog;

    if (actionType === "logout-account") {
      closeConfirm();
      navigate("/admin");
      return;
    }

    if (
      (actionType === "identity-delete" ||
        actionType === "identity-operation") &&
      payload?.identityId &&
      payload?.operationKey
    ) {
      const { identityId, operationKey } = payload;
      const identity = identities.find((i) => i.id === identityId);
      const providerMeta = getIdentityProviderMeta(identity?.provider || "");
      const identityTitle =
        identity?.email || identity?.account || providerMeta.title;

      if (operationKey === "delete") {
        setIdentities((prev) => prev.filter((i) => i.id !== identityId));
        setSubjectsToIdentities((prev) =>
          prev
            .filter((r) => r.identityId !== identityId)
            .map((r, idx) => ({ ...r, orderIndex: idx })),
        );
        setIdentityOperations((prev) => {
          const next = { ...prev };
          delete next[identityId];
          return next;
        });
        setLastOperation({
          status: "success",
          message: `Identity "${identityTitle}" was detached from this subject.`,
        });
      } else {
        let message = "Identity action completed.";
        if (operationKey === "change-email") {
          message = `Email change flow opened for "${identityTitle}".`;
        } else if (operationKey === "change-password") {
          message = `Password change flow opened for "${identityTitle}".`;
        } else if (operationKey === "reconnect") {
          message = `${providerMeta.title} identity reconnect flow started.`;
        }

        setIdentityOperations((prev) => ({
          ...prev,
          [identityId]: {
            status: "success",
            operationKey,
            message,
          },
        }));
        setLastOperation({ status: "success", message });
      }

      closeConfirm();
      return;
    }

    closeConfirm();
  };

  const handleLogout = () => {
    openConfirm({
      actionType: "logout-account",
      title: "Log out from account?",
      description: "Current session will be closed in this prototype view.",
      confirmLabel: "Log out",
      payload: null,
    });
  };

  const isDeleteAction = ["identity-delete"].includes(confirmDialog.actionType);

  // Sort identities by their relation order
  const sortedIdentityRelations = [...subjectsToIdentities].sort(
    (a, b) => a.orderIndex - b.orderIndex,
  );

  return (
    <>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl tracking-tight">Account Settings</h1>
        </div>

        {/* Subject Card */}
        <article className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl">Subject</h2>
              <p className="mt-1 text-sm text-slate-600">
                Core RBAC account entity. Authentication and profile data are
                linked through relations.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2 xl:grid-cols-5">
            <div className="min-w-0">
              <span className="block text-slate-500">ID</span>
              <CopyIdButton value={accountSubject.id} />
            </div>
            <div>
              <span className="text-slate-500">Slug</span>
              <p className="mt-0.5 text-slate-900">{accountSubject.slug}</p>
            </div>
            <div>
              <span className="text-slate-500">Variant</span>
              <p className="mt-0.5 text-slate-900">{accountSubject.variant}</p>
            </div>
            <div>
              <span className="text-slate-500">Created</span>
              <p className="mt-0.5 text-slate-900">
                {formatDateTime(accountSubject.createdAt)}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Updated</span>
              <p className="mt-0.5 text-slate-900">
                {formatDateTime(accountSubject.updatedAt)}
              </p>
            </div>
          </div>
        </article>

        {/* Identities Section */}
        <article className="rounded-lg border border-slate-300 bg-slate-50 p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h2 className="text-xl">Identities</h2>
              <p className="mt-1 text-sm text-slate-600">
                Each identity is an independent login method. Actions differ by
                provider type.
              </p>
            </div>
          </div>

          {lastOperation && (
            <div className="mt-3 flex items-start gap-3 rounded-md border border-slate-300 bg-white p-3">
              <p className="text-sm text-slate-700">
                {getStatusText(lastOperation.status)}: {lastOperation.message}
              </p>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {sortedIdentityRelations.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                No identities linked to this subject.
              </div>
            ) : (
              sortedIdentityRelations.map((subjectToIdentity) => {
                const identity = identities.find(
                  (i) => i.id === subjectToIdentity.identityId,
                );
                if (!identity) return null;

                const providerMeta = getIdentityProviderMeta(identity.provider);
                const identityOpState = identityOperations[identity.id];
                const actions = getIdentityActions(identity);

                return (
                  <article
                    key={identity.id}
                    className="rounded-lg border border-slate-300 bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base text-slate-900">
                            {providerMeta.title}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {providerMeta.description}
                        </p>
                      </div>
                      {identityOpState && (
                        <p className="text-xs text-slate-500">
                          {getStatusText(identityOpState.status)}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2 xl:grid-cols-5">
                      <div className="min-w-0">
                        <span className="block text-slate-500">
                          Identity ID
                        </span>
                        <CopyIdButton value={identity.id} />
                      </div>
                      <div>
                        <span className="text-slate-500">Login</span>
                        <p className="mt-0.5 break-all text-slate-900">
                          {getIdentityPrimaryLogin(identity)}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Provider Key</span>
                        <p className="mt-0.5 font-mono text-xs text-slate-900">
                          {identity.provider}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <span className="block text-slate-500">
                          Relation ID
                        </span>
                        <CopyIdButton value={subjectToIdentity.id} />
                      </div>
                      <div>
                        <span className="text-slate-500">Updated</span>
                        <p className="mt-0.5 text-slate-900">
                          {formatDateTime(identity.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {actions.map((action) => {
                        const isDanger = action.tone === "danger";
                        return (
                          <button
                            key={action.key}
                            type="button"
                            onClick={() =>
                              handleIdentityAction(identity.id, action.key)
                            }
                            className={cn(
                              "inline-flex items-center rounded-md border px-3 py-2 text-sm transition",
                              isDanger
                                ? "border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                            )}
                          >
                            {action.label}
                          </button>
                        );
                      })}
                    </div>

                    {identityOpState?.message && (
                      <p className="mt-2 text-xs text-slate-500">
                        {identityOpState.message}
                      </p>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </article>

        {/* Social Profiles Section */}
        <article className="rounded-lg border border-slate-300 bg-slate-50 p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h2 className="text-xl">Social Profiles</h2>
              <p className="mt-1 text-sm text-slate-600">
                Public-facing profile data is stored in social module profiles
                linked to this subject.
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {accountSubjectsToSocialProfiles.length === 0 ? (
              <div className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                No social profiles linked to this subject.
              </div>
            ) : (
              accountSubjectsToSocialProfiles
                .slice()
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((subjectToProfile) => {
                  const profile = accountSocialProfiles.find(
                    (p) => p.id === subjectToProfile.socialModuleProfileId,
                  );
                  if (!profile) return null;

                  return (
                    <article
                      key={profile.id}
                      className="rounded-lg border border-slate-300 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-base text-slate-900">
                            {profile.adminTitle ||
                              getLocalizedValue(profile.title)}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {getLocalizedValue(profile.subtitle)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/admin/social/profile/${profile.id}`)
                          }
                          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open profile
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
                        <div className="min-w-0">
                          <span className="block text-slate-500">
                            Profile ID
                          </span>
                          <CopyIdButton value={profile.id} />
                        </div>
                        <div>
                          <span className="text-slate-500">Slug</span>
                          <p className="mt-0.5 font-mono text-xs text-slate-900">
                            {profile.slug || "\u2014"}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">Title</span>
                          <p className="mt-0.5 text-slate-900">
                            {getLocalizedValue(profile.title)}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <span className="block text-slate-500">
                            Relation ID
                          </span>
                          <CopyIdButton value={subjectToProfile.id} />
                        </div>
                      </div>
                    </article>
                  );
                })
            )}
          </div>
        </article>

        {/* Logout Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </button>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && closeConfirm()}
      >
        <DialogContent
          className="max-w-md gap-0 overflow-hidden p-0"
          aria-describedby={undefined}
        >
          <div className="space-y-2 p-6">
            <DialogTitle className="text-xl">{confirmDialog.title}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {confirmDialog.description}
            </DialogDescription>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-border p-6">
            <button
              type="button"
              onClick={closeConfirm}
              className="rounded-md border border-border px-4 py-2 text-sm transition hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={executeConfirm}
              className={cn(
                "inline-flex items-center rounded-md border px-4 py-2 text-sm text-white transition",
                isDeleteAction
                  ? "border-red-300 bg-red-600 hover:bg-red-700"
                  : "border-slate-400 bg-slate-900 hover:border-slate-500 hover:bg-slate-800",
              )}
            >
              {confirmDialog.confirmLabel || "Confirm"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

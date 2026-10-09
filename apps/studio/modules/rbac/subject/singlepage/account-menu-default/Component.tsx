import {
  ChevronDown,
  LogIn,
} from "../../../../../workspace/utils/components/ModuleIcons";

import {
  defaultAccountMenuActions,
  defaultRbacUser,
  type AccountMenuAction,
  type RbacAccountUser,
} from "../../../shared";

export interface SubjectAccountMenuDefaultProps {
  user: RbacAccountUser;
  actions: AccountMenuAction[];
  signedIn: boolean;
  loginHref: string;
}

export const defaultSubjectAccountMenuDefaultProps: SubjectAccountMenuDefaultProps =
  {
    user: defaultRbacUser,
    actions: defaultAccountMenuActions,
    signedIn: true,
    loginHref: "/rbac/subject/authentication/select-method",
  };

export function SubjectAccountMenuDefault(
  props?: Partial<SubjectAccountMenuDefaultProps>,
) {
  const { user, actions, signedIn, loginHref } = {
    ...defaultSubjectAccountMenuDefaultProps,
    ...props,
  };

  if (!signedIn) {
    return (
      <a
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] px-4 text-sm text-[var(--workspace-brand-foreground)] no-underline transition hover:bg-[var(--workspace-brand-background)]"
        data-ds-block="rbac.subject.account-menu-default"
        data-ds-layer="singlepage"
        href={loginHref}
      >
        <LogIn className="h-5 w-5" />
        Sign in
      </a>
    );
  }

  return (
    <div
      className="w-full max-w-xs rounded-2xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] p-2 shadow-sm"
      data-ds-block="rbac.subject.account-menu-default"
      data-ds-layer="singlepage"
    >
      <button
        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[var(--workspace-brand-background)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-brand-focus)] min-h-11"
        type="button"
      >
        <img
          alt=""
          className="h-10 w-10 rounded-full object-cover"
          src={user.avatar}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-[var(--workspace-brand-foreground)]">
            {user.name}
          </span>
          <span className="block truncate text-xs text-[var(--workspace-brand-muted)]">
            {user.email}
          </span>
        </span>
        <ChevronDown className="h-5 w-5 text-[var(--workspace-brand-muted)]" />
      </button>

      <div className="mt-2 border-t border-[var(--workspace-brand-line)] pt-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isDanger = action.tone === "danger";

          return (
            <a
              className={
                isDanger
                  ? "flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--workspace-brand-danger)] no-underline transition hover:bg-[var(--workspace-brand-danger-surface)]"
                  : "flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--workspace-brand-foreground)] no-underline transition hover:bg-[var(--workspace-brand-background)]"
              }
              href={action.href}
              key={action.key}
            >
              <Icon className="h-5 w-5" />
              {action.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

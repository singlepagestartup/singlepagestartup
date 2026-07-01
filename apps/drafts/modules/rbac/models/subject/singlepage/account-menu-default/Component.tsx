import { ChevronDown, LogIn } from "lucide-react";

import {
  defaultAccountMenuActions,
  defaultRbacUser,
  type AccountMenuAction,
  type RbacAccountUser,
} from "../../../../shared";

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
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-700 no-underline transition hover:bg-slate-50"
        data-ds-block="rbac.subject.account-menu-default"
        data-ds-layer="singlepage"
        href={loginHref}
      >
        <LogIn className="h-4 w-4" />
        Sign In
      </a>
    );
  }

  return (
    <div
      className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
      data-ds-block="rbac.subject.account-menu-default"
      data-ds-layer="singlepage"
    >
      <button
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-slate-50"
        type="button"
      >
        <img
          alt=""
          className="h-10 w-10 rounded-full object-cover"
          src={user.avatar}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-900">
            {user.name}
          </span>
          <span className="block truncate text-xs text-slate-500">
            {user.email}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      <div className="mt-2 border-t border-slate-100 pt-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isDanger = action.tone === "danger";

          return (
            <a
              className={
                isDanger
                  ? "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 no-underline transition hover:bg-red-50"
                  : "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 no-underline transition hover:bg-slate-50"
              }
              href={action.href}
              key={action.key}
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

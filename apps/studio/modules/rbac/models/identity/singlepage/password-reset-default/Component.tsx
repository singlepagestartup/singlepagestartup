import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";

export interface IdentityPasswordResetDefaultProps {
  title: string;
  description: string;
  emailLabel: string;
  emailPlaceholder: string;
  submitLabel: string;
  backLabel: string;
  backHref: string;
  backStoryHref?: string;
  sent?: boolean;
  sentTitle: string;
  sentDescription: string;
  sentEmail: string;
}

export const defaultIdentityPasswordResetDefaultProps: IdentityPasswordResetDefaultProps =
  {
    title: "Forgot password?",
    description: "Enter your email and we will send you a reset link",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    submitLabel: "Send Reset Link",
    backLabel: "Back to Sign In",
    backHref: "/rbac/subject/authentication/select-method",
    sent: false,
    sentTitle: "Check your inbox",
    sentDescription: "We sent a password reset link to",
    sentEmail: "sarah@sps.dev",
  };

function getStoryLinkProps(href: string, storyHref?: string) {
  if (storyHref) {
    return { href: storyHref, target: "_top" as const };
  }

  return { href };
}

export function IdentityPasswordResetDefault(
  props?: Partial<IdentityPasswordResetDefaultProps>,
) {
  const {
    title,
    description,
    emailLabel,
    emailPlaceholder,
    submitLabel,
    backLabel,
    backHref,
    backStoryHref,
    sent,
    sentTitle,
    sentDescription,
    sentEmail,
  } = {
    ...defaultIdentityPasswordResetDefaultProps,
    ...props,
  };

  return (
    <section
      className="w-full py-12"
      data-ds-block="rbac.identity.password-reset-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-md px-4 sm:px-6 lg:px-0">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-8 pb-6 pt-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Mail className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-medium tracking-tight text-slate-900">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">{description}</p>
          </div>

          <div className="px-8 py-6">
            {sent ? (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle2 className="h-7 w-7 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {sentTitle}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {sentDescription}{" "}
                    <strong className="text-slate-700">{sentEmail}</strong>
                  </p>
                </div>
                <a
                  className="inline-flex items-center gap-1.5 text-sm text-slate-700 transition hover:text-slate-900"
                  {...getStoryLinkProps(backHref, backStoryHref)}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {backLabel}
                </a>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label
                    className="mb-1.5 block text-xs font-medium text-slate-500"
                    htmlFor="rbac-password-reset-email"
                  >
                    {emailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className="w-full rounded-md border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                      id="rbac-password-reset-email"
                      placeholder={emailPlaceholder}
                      readOnly
                      type="email"
                    />
                  </div>
                </div>

                <button
                  className="flex w-full items-center justify-center rounded-md border border-slate-400 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  type="button"
                >
                  {submitLabel}
                </button>
              </div>
            )}
          </div>

          {!sent ? (
            <div className="border-t border-slate-100 px-8 py-4 text-center">
              <a
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-700"
                {...getStoryLinkProps(backHref, backStoryHref)}
              >
                <ArrowLeft className="h-3 w-3" />
                {backLabel}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

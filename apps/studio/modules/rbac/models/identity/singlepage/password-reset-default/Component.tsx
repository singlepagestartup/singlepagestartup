import { Button } from "../../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
} from "../../../../../../workspace/utils/components/ModuleIcons";

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
    backLabel: "Back to Sign in",
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
      className="w-full bg-[var(--workspace-brand-background)] py-12 sm:py-16"
      data-ds-block="rbac.identity.password-reset-default"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-lg px-4 sm:px-6 lg:px-0">
        <div className="overflow-hidden rounded-3xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] shadow-sm">
          <div className="px-6 pb-2 pt-8 sm:px-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--workspace-brand-accent)] text-[var(--workspace-brand-on-accent)]">
              <Mail className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--workspace-brand-foreground)]">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-[var(--workspace-brand-muted)]">
              {description}
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {sent ? (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--workspace-brand-background)]">
                  <CheckCircle2 className="h-11 w-11 text-[var(--workspace-brand-foreground)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--workspace-brand-foreground)]">
                    {sentTitle}
                  </p>
                  <p className="mt-1 text-xs text-[var(--workspace-brand-muted)]">
                    {sentDescription}{" "}
                    <strong className="text-[var(--workspace-brand-foreground)]">
                      {sentEmail}
                    </strong>
                  </p>
                </div>
                <a
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--workspace-brand-foreground)] transition hover:text-[var(--workspace-brand-foreground)]"
                  {...getStoryLinkProps(backHref, backStoryHref)}
                >
                  <ArrowLeft className="h-5 w-5" />
                  {backLabel}
                </a>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label
                    className="mb-1.5 block text-sm font-medium text-[var(--workspace-brand-muted)]"
                    htmlFor="rbac-password-reset-email"
                  >
                    {emailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--workspace-brand-muted)]" />
                    <input
                      className="w-full rounded-xl border border-[var(--workspace-brand-line)] bg-[var(--workspace-brand-surface)] min-h-12 py-3 pl-12 pr-4 text-base text-[var(--workspace-brand-foreground)] outline-none transition placeholder:text-[var(--workspace-brand-muted)] focus:border-[var(--workspace-brand-line)] focus:ring-1 focus:ring-[var(--workspace-brand-focus)] focus-visible:border-[var(--workspace-brand-focus)] focus-visible:ring-2 focus-visible:ring-[var(--workspace-brand-focus)]"
                      id="rbac-password-reset-email"
                      placeholder={emailPlaceholder}
                      readOnly
                      type="email"
                    />
                  </div>
                </div>

                <Button className="w-full" type="button">
                  {submitLabel}
                </Button>
              </div>
            )}
          </div>

          {!sent ? (
            <div className="border-t border-[var(--workspace-brand-line)] px-6 py-5 text-center sm:px-8">
              <a
                className="inline-flex items-center gap-1.5 text-xs text-[var(--workspace-brand-muted)] transition hover:text-[var(--workspace-brand-foreground)]"
                {...getStoryLinkProps(backHref, backStoryHref)}
              >
                <ArrowLeft className="h-5 w-5" />
                {backLabel}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

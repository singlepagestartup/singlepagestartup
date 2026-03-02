"use client";

import { Button, Card } from "@sps/shared-ui-shadcn";
import { CircleHelp, ExternalLink, LogOut, UserRound } from "lucide-react";
import { copyToClipboard } from "@sps/shared-frontend-client-utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  accountIdentities,
  accountSocialProfiles,
  accountSubject,
  accountSubjectsToIdentities,
  accountSubjectsToSocialProfiles,
} from "./data";

type IAccountSettingsPageProps = {
  adminBasePath: string;
  onIdentityAction?: (identityId: string, actionKey: string) => void;
  onLogout?: () => void;
};

function formatDateTime(value?: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLocalizedValue(value: unknown): string {
  if (!value) {
    return "—";
  }

  if (typeof value === "string") {
    return value || "—";
  }

  if (typeof value === "object") {
    const dictionary = value as Record<string, unknown>;
    return (
      String(dictionary.en || "") ||
      String(dictionary.ru || "") ||
      String(
        Object.values(dictionary).find((item) => typeof item === "string") ||
          "",
      ) ||
      "—"
    );
  }

  return String(value);
}

function getIdentityProviderMeta(provider: string) {
  const normalized = String(provider || "unknown").toLowerCase();

  if (normalized === "email_and_password" || normalized === "email") {
    return {
      title: "Email & Password",
      description:
        "Classic credential identity. Supports email updates and password rotation.",
    };
  }

  if (normalized === "telegram" || normalized.includes("telegram")) {
    return {
      title: "Telegram",
      description:
        "External provider identity resolved via Telegram account and bot auth flow.",
    };
  }

  if (
    normalized.includes("oauth") ||
    normalized.includes("google") ||
    normalized.includes("github")
  ) {
    return {
      title: "OAuth",
      description:
        "OAuth identity. Password management is handled by upstream provider.",
    };
  }

  return {
    title: "External Provider",
    description:
      "External identity provider. Available actions depend on provider capabilities.",
  };
}

function getIdentityPrimaryLogin(identity: {
  email: string;
  account: string;
}): string {
  return identity.email || identity.account || "No public account/email stored";
}

export function Component(props: IAccountSettingsPageProps) {
  const router = useRouter();

  const content = (
    <section data-testid="account-settings-page" className="space-y-4">
      <Card
        data-testid="account-subject-card"
        className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm"
      >
        <h2 className="text-xl font-semibold">Subject</h2>
        <p className="mt-1 text-sm text-slate-600">
          Core RBAC account entity. Authentication and profile data are linked
          through relations.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2 xl:grid-cols-5">
          <div>
            <span className="text-slate-500">ID</span>
            <Button
              type="button"
              variant="outline"
              className="mt-0.5 block !w-fit max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-1 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100"
              title={accountSubject.id}
              onClick={() => {
                void copyToClipboard(accountSubject.id);
              }}
            >
              {accountSubject.id}
            </Button>
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
      </Card>

      <Card
        data-testid="account-identities-section"
        className="rounded-lg border border-slate-300 bg-slate-50 p-5 shadow-sm"
      >
        <h2 className="text-xl font-semibold">Identities</h2>
        <p className="mt-1 text-sm text-slate-600">
          Each identity is an independent login method. Actions differ by
          provider type.
        </p>

        <div className="mt-4 space-y-3">
          {accountSubjectsToIdentities
            .slice()
            .sort(
              (a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0),
            )
            .map((subjectToIdentity) => {
              const identity = accountIdentities.find(
                (item) => item.id === subjectToIdentity.identityId,
              );

              if (!identity) {
                return null;
              }

              const providerMeta = getIdentityProviderMeta(identity.provider);

              return (
                <Card
                  key={subjectToIdentity.id}
                  className="rounded-lg border-slate-300 bg-white p-4"
                >
                  <h3 className="text-base font-semibold text-slate-900">
                    {providerMeta.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {providerMeta.description}
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2 xl:grid-cols-5">
                    <div>
                      <span className="text-slate-500">Identity ID</span>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-0.5 block !w-fit max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-1 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100"
                        title={identity.id}
                        onClick={() => {
                          void copyToClipboard(identity.id);
                        }}
                      >
                        {identity.id}
                      </Button>
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

                    <div>
                      <span className="text-slate-500">Relation ID</span>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-0.5 block !w-fit max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-1 text-left font-mono text-xs text-slate-900 transition hover:bg-slate-100"
                        title={subjectToIdentity.id}
                        onClick={() => {
                          void copyToClipboard(subjectToIdentity.id);
                        }}
                      >
                        {subjectToIdentity.id}
                      </Button>
                    </div>

                    <div>
                      <span className="text-slate-500">Updated</span>
                      <p className="mt-0.5 text-slate-900">
                        {formatDateTime(identity.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="!w-auto rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      onClick={() =>
                        props.onIdentityAction?.(identity.id, "change-email")
                      }
                    >
                      Change email
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="!w-auto rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      onClick={() =>
                        props.onIdentityAction?.(identity.id, "change-password")
                      }
                    >
                      Change password
                    </Button>
                  </div>
                </Card>
              );
            })}
        </div>
      </Card>

      <Card
        data-testid="account-social-profiles-section"
        className="rounded-lg border border-slate-300 bg-slate-50 p-5 shadow-sm"
      >
        <h2 className="text-xl font-semibold">Social Profiles</h2>
        <p className="mt-1 text-sm text-slate-600">
          Public-facing profile data is stored in social module profiles linked
          to this subject.
        </p>

        <div className="mt-4 space-y-3">
          {accountSubjectsToSocialProfiles
            .slice()
            .sort(
              (a, b) => Number(a.orderIndex || 0) - Number(b.orderIndex || 0),
            )
            .map((subjectToProfile) => {
              const profile = accountSocialProfiles.find(
                (item) => item.id === subjectToProfile.socialModuleProfileId,
              );

              if (!profile) {
                return null;
              }

              return (
                <Card
                  key={subjectToProfile.id}
                  className="rounded-lg border-slate-300 bg-white p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-900">
                        {profile.adminTitle || getLocalizedValue(profile.title)}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {getLocalizedValue(profile.subtitle)}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="!w-auto rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                      onClick={() => {
                        router.push(
                          `${props.adminBasePath}/modules/social/models/profile/${profile.id}`,
                        );
                      }}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open profile
                    </Button>
                  </div>
                </Card>
              );
            })}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          className="!w-auto rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          onClick={props.onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </section>
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header className="flex h-16 items-center border-b border-border bg-card px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4" />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="!w-10 rounded-md p-2 transition hover:bg-muted"
            aria-label="Help"
          >
            <CircleHelp className="h-5 w-5" />
          </Button>

          <Button
            asChild
            variant="outline"
            size="icon"
            className="!w-10 rounded-md p-2 transition hover:bg-muted"
          >
            <Link href={`${props.adminBasePath}/profile`} aria-label="Account">
              <UserRound className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-background p-6">
        <div className="mx-auto max-w-7xl space-y-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight capitalize">
              Profile
            </h1>
          </div>

          {content}
        </div>
      </main>
    </div>
  );
}

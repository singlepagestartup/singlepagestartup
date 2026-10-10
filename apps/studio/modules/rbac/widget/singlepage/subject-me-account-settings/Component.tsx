"use client";
import type { IAIChatServicePageContent } from "../../../../../workspace/utils/products/ai-chat-content";
import { useId, useState } from "react";
import { Component as RbacModuleSubject } from "../../../subject";
import {
  useStudioAccount,
  useAIChatProjectHref,
} from "../../../subject/singlepage/account/Account";
import {
  Button,
  Select,
} from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import {
  ArrowLeft,
  LogOut,
} from "../../../../../workspace/utils/components/ModuleIcons";

export interface SubjectMeAccountSettingsProps {
  copy?: IAIChatServicePageContent;
  showTokens?: boolean;
  initialSection?: "profile" | "sign-in" | "purchases" | "data";
}
export const defaultSubjectMeAccountSettingsProps: SubjectMeAccountSettingsProps =
  { showTokens: false, initialSection: "profile" };

export function SubjectMeAccountSettings({
  copy,
  showTokens = false,
  initialSection = "profile",
}: SubjectMeAccountSettingsProps = {}) {
  const session = useStudioAccount();
  const projectHref = useAIChatProjectHref();
  const [activeSection, setActiveSection] = useState<string>(initialSection);
  const [signedOut, setSignedOut] = useState(false);
  const id = useId();
  const sections = [
    {
      id: "profile",
      label: "Profile",
      content: <RbacModuleSubject variant="me-profile-information" />,
    },
    {
      id: "sign-in",
      label: "Sign-in methods",
      content: <RbacModuleSubject variant="me-identity-find-information" />,
    },
    {
      id: "purchases",
      label: showTokens ? "Tokens and purchases" : "Purchases",
      content: (
        <RbacModuleSubject
          variant="account-data"
          copy={copy}
          section="purchases"
          showTokens={showTokens}
        />
      ),
    },
    {
      id: "data",
      label: "Data and privacy",
      content: (
        <RbacModuleSubject
          variant="account-data"
          copy={copy}
          section="data"
          showTokens={showTokens}
        />
      ),
    },
  ];
  return (
    <section
      className="w-full bg-sps-grey py-6 font-sps text-sps-graphite sm:py-8"
      data-ds-block="rbac.widget.subject-me-account-settings"
      data-ds-imports="rbac.subject.me-profile-information rbac.subject.me-identity-find-information rbac.subject.account-data"
      data-ds-layer="singlepage"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {showTokens && (
          <a
            href={projectHref}
            className="mb-6 inline-flex min-h-11 items-center gap-2 text-sm text-sps-muted"
          >
            <ArrowLeft className="size-4" />
            Back to workspace
          </a>
        )}
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Account settings
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-sps-muted">
              Edit your profile, manage how you sign in and review your account
              data.
            </p>
          </div>
          <Button
            variant="secondary"
            type="button"
            disabled={signedOut}
            onClick={() => {
              session.signOut();
              setSignedOut(true);
            }}
          >
            <LogOut className="size-4" />
            {signedOut ? "Signed out" : "Sign out"}
          </Button>
        </header>
        {signedOut ? (
          <p
            role="status"
            className="rounded-xl border border-sps-line bg-sps-white p-6"
          >
            You are signed out.{" "}
            <a
              className="underline"
              href={
                showTokens
                  ? "/ai-chat/login"
                  : "/?path=/story/modules-host-models-page-singlepage-rbac-subject-authentication-select-method--default"
              }
              target={showTokens ? undefined : "_top"}
            >
              Sign in again
            </a>
          </p>
        ) : (
          <div className="grid min-w-0 items-start gap-6 md:grid-cols-[12rem_minmax(0,1fr)]">
            <div className="min-w-0 md:hidden">
              <label
                className="mb-2 block text-sm font-medium"
                htmlFor={`${id}-select`}
              >
                Settings section
              </label>
              <Select
                id={`${id}-select`}
                aria-label="Settings section"
                value={activeSection}
                onValueChange={setActiveSection}
                options={sections.map(({ id, label }) => ({
                  value: id,
                  label,
                }))}
              />
            </div>
            <nav
              aria-label="Settings"
              className="sticky top-24 hidden space-y-1 md:block"
            >
              {sections.map(({ id: sectionId, label }) => (
                <button
                  key={sectionId}
                  id={`${id}-nav-${sectionId}`}
                  aria-controls={`${id}-panel-${sectionId}`}
                  aria-current={
                    activeSection === sectionId ? "page" : undefined
                  }
                  onClick={() => setActiveSection(sectionId)}
                  type="button"
                  className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sps-graphite ${activeSection === sectionId ? "bg-sps-white" : "text-sps-muted hover:bg-sps-white"}`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-5 w-1 shrink-0 rounded-full ${activeSection === sectionId ? "bg-sps-green" : "bg-transparent"}`}
                  />
                  {label}
                </button>
              ))}
            </nav>
            <div className="min-w-0">
              {sections.map(({ id: sectionId, label, content }) => (
                <div
                  key={sectionId}
                  id={`${id}-panel-${sectionId}`}
                  role="region"
                  aria-label={label}
                  hidden={activeSection !== sectionId}
                  className="min-w-0"
                >
                  {content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

"use client";
import { useId, useRef, useState, type FormEvent } from "react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import {
  Button,
  Icon,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/primitives";
import defaultCopy from "./content.json";
import {
  useAIChatAccount,
  useAIChatProjectHref,
} from "../ai-chat-account/Account";
import type { IAIChatServicePageContent } from "../../../../../workspace/utils/products/ai-chat-content";
import {
  Feedback,
  PageSection,
  PasswordField,
  SectionText,
  ServicePage,
} from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";

export interface ISettingsProps {
  copy?: IAIChatServicePageContent;
}

export function Component({ copy = defaultCopy }: ISettingsProps = {}) {
  const aiChatAccount = useAIChatAccount();
  const { sections, labels } = copy;
  const projectHref = useAIChatProjectHref();
  const id = useId();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [accountSaved, setAccountSaved] = useState(false);
  const [purchasesOpen, setPurchasesOpen] = useState(false);
  const [deletionOpen, setDeletionOpen] = useState(false);
  const [deletionChecked, setDeletionChecked] = useState(false);
  const [portal, setPortal] = useState<HTMLDivElement | null>(null);
  const cancel = useRef<HTMLButtonElement>(null);

  function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== repeatPassword) {
      setPasswordError(labels["password-mismatch"]);
      return;
    }
    if (currentPassword === password) {
      setPasswordError(labels["password-unchanged"]);
      return;
    }
    setCurrentPassword("");
    setPassword("");
    setRepeatPassword("");
    setPasswordError("");
    setAccountSaved(true);
  }

  return (
    <ServicePage copy={copy} projectHref={projectHref}>
      <div className="grid min-w-0 gap-5">
        <PageSection section={sections.account} icon="lock-key">
          <form className="mt-6 grid max-w-xl gap-5" onSubmit={saveAccount}>
            <PasswordField
              label={labels["current-password-label"]}
              name="current-password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => {
                setCurrentPassword(event.target.value);
                setAccountSaved(false);
                setPasswordError("");
              }}
            />
            <PasswordField
              label={labels["password-label"]}
              name="new-password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setAccountSaved(false);
                setPasswordError("");
              }}
            />
            <PasswordField
              label={labels["repeat-password-label"]}
              name="repeat-password"
              autoComplete="new-password"
              required
              value={repeatPassword}
              error={passwordError}
              onChange={(event) => {
                setRepeatPassword(event.target.value);
                setAccountSaved(false);
                setPasswordError("");
              }}
            />
            <Button
              type="submit"
              className="w-fit"
              disabled={!currentPassword || !password || !repeatPassword}
            >
              <Icon name="floppy-disk" />
              {labels["save-account"]}
            </Button>
            {accountSaved && (
              <Feedback kind="success">{labels["success-message"]}</Feedback>
            )}
          </form>
        </PageSection>

        <PageSection section={sections.purchases} icon="wallet">
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={labels["tokens-href"]} className={kit.button}>
              <Icon name="plus" />
              {labels["buy-tokens"]}
            </a>
            <Button
              variant="secondary"
              aria-expanded={purchasesOpen}
              aria-controls={`${id}-purchases`}
              onClick={() => setPurchasesOpen((current) => !current)}
            >
              <Icon name="credit-card" />
              {labels["purchases-label"]}
            </Button>
          </div>
          {purchasesOpen && (
            <div
              id={`${id}-purchases`}
              className="mt-5 rounded-xl bg-sps-grey p-4 text-sm leading-6 text-sps-muted"
              role="status"
            >
              {labels["purchases-empty"]}
            </div>
          )}
        </PageSection>

        <PageSection section={sections.privacy} icon="shield">
          <div className="mt-6 border-t border-sps-danger-line pt-6">
            <h3 className="text-lg font-semibold">{sections.danger.title}</h3>
            <SectionText section={sections.danger} />
            <div ref={setPortal} className="mt-5">
              <AlertDialog.Root
                open={deletionOpen}
                onOpenChange={setDeletionOpen}
              >
                <AlertDialog.Trigger asChild>
                  <Button variant="danger">
                    <Icon name="trash" />
                    {labels["delete-label"]}
                  </Button>
                </AlertDialog.Trigger>
                <AlertDialog.Portal container={portal}>
                  <AlertDialog.Overlay className="fixed inset-0 z-[200] bg-black/40" />
                  <AlertDialog.Content
                    className="fixed left-1/2 top-1/2 z-[210] max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-sps-line bg-sps-white p-6 font-sps text-sps-graphite shadow-xl"
                    onOpenAutoFocus={(event) => {
                      event.preventDefault();
                      cancel.current?.focus();
                    }}
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sps-danger-surface text-sps-danger">
                      <Icon name="trash" size={24} />
                    </div>
                    <AlertDialog.Title className="text-2xl font-semibold leading-tight">
                      {labels["deletion-title"]}
                    </AlertDialog.Title>
                    <AlertDialog.Description className="mt-3 text-sm leading-6 text-sps-muted">
                      {labels["deletion-description"]}
                    </AlertDialog.Description>
                    <dl className="mt-5 grid gap-3 rounded-xl bg-sps-grey p-4 text-sm">
                      <div>
                        <dt className="text-sps-muted">
                          {labels["account-summary-label"]}
                        </dt>
                        <dd className="mt-1 break-words font-medium">
                          {aiChatAccount.email}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sps-muted">
                          {labels["project-summary-label"]}
                        </dt>
                        <dd className="mt-1 break-words font-medium">
                          {labels["all-projects-summary"]}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                      <AlertDialog.Cancel asChild>
                        <Button ref={cancel} variant="secondary">
                          {labels.cancel}
                        </Button>
                      </AlertDialog.Cancel>
                      <AlertDialog.Action asChild>
                        <Button
                          variant="danger"
                          onClick={() => setDeletionChecked(true)}
                        >
                          {labels["confirm-delete"]}
                        </Button>
                      </AlertDialog.Action>
                    </div>
                  </AlertDialog.Content>
                </AlertDialog.Portal>
              </AlertDialog.Root>
            </div>
            {deletionChecked && (
              <div className="mt-4">
                <Feedback>{labels["deletion-message"]}</Feedback>
              </div>
            )}
          </div>
        </PageSection>

        <details className="rounded-xl border border-sps-line px-5 py-4 text-sm">
          <summary className={`w-fit cursor-pointer font-medium ${kit.focus}`}>
            {sections.recovery.title}
          </summary>
          <div className="mt-3">
            <SectionText section={sections.recovery} />
          </div>
          <a href={labels["help-href"]} className={`mt-3 ${kit.plain}`}>
            <Icon name="question" />
            {labels["help-label"]}
          </a>
        </details>
      </div>
    </ServicePage>
  );
}

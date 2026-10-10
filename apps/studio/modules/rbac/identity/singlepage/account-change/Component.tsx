"use client";
import { useId, useState, type FormEvent } from "react";
import {
  Button,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import { PasswordField } from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";
import {
  CheckCircle2,
  Mail,
} from "../../../../../workspace/utils/components/ModuleIcons";

export interface IAccountChangeProps {
  kind?: "email" | "password";
  email?: string;
  onComplete?: (email?: string) => void;
  onCancel?: () => void;
}
export function Component({
  kind = "email",
  email = "alex@example.com",
  onComplete,
  onCancel,
}: IAccountChangeProps = {}) {
  const [step, setStep] = useState<
    "start" | "verify-current" | "details" | "verify-new" | "complete"
  >("start");
  const [code, setCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const id = useId();
  const title = kind === "email" ? "Change email" : "Change password";
  const steps =
    kind === "email"
      ? ["Verify current email", "New email", "Verify new email"]
      : ["Verify email", "New password"];
  const active = step === "details" ? 1 : step === "verify-new" ? 2 : 0;
  function advance(next: typeof step) {
    setStep(next);
    setError("");
    setCode("");
    setResent(false);
  }
  function complete(nextEmail?: string) {
    try {
      onComplete?.(nextEmail);
    } catch {
      setError("Could not save the change. Try again.");
      return;
    }
    setCurrentPassword("");
    setPassword("");
    setRepeat("");
    advance("complete");
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (step === "verify-current" || step === "verify-new") {
      if (code.trim() !== "123456") {
        setError("That code is incorrect. Use the preview code 123456.");
        return;
      }
      if (step === "verify-new") complete(newEmail.trim().toLowerCase());
      else advance("details");
    } else if (kind === "email") {
      if (newEmail.trim().toLowerCase() === email.toLowerCase()) {
        setError("Enter a different email address.");
        return;
      }
      advance("verify-new");
    } else {
      if (password !== repeat) {
        setError("The new passwords do not match.");
        return;
      }
      if (password === currentPassword) {
        setError("Choose a password different from your current one.");
        return;
      }
      complete();
    }
  }
  return (
    <section
      aria-label={title}
      className="mt-5 min-w-0 rounded-xl border border-sps-line bg-sps-grey p-4 sm:p-5"
      data-ds-block="rbac.identity.account-change"
    >
      <h4 className="text-base font-semibold">{title}</h4>
      {step === "complete" ? (
        <div className="mt-4 space-y-4">
          <p role="status" className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="size-5 shrink-0" />
            {kind === "email"
              ? `Email updated to ${newEmail.trim().toLowerCase()} in this preview.`
              : "Password change completed in this preview. Passwords are not stored."}
          </p>
          <Button variant="secondary" onClick={onCancel}>
            Done
          </Button>
        </div>
      ) : (
        <>
          <ol
            aria-label="Change progress"
            className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-sps-muted"
          >
            {steps.map((label, index) => (
              <li
                key={label}
                aria-current={active === index ? "step" : undefined}
                className={
                  active === index ? "font-semibold text-sps-graphite" : ""
                }
              >
                {index + 1}. {label}
              </li>
            ))}
          </ol>
          {step === "start" ? (
            <div className="mt-5 space-y-4">
              <p className="break-words text-sm leading-6 text-sps-muted">
                First, confirm access to {email}. Then{" "}
                {kind === "email"
                  ? "enter and verify your new email address."
                  : "enter your current password and choose a new one."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => advance("verify-current")}>
                  <Mail className="size-4" />
                  Send verification code
                </Button>
                <Button variant="secondary" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <form
              key={step}
              className="mt-5 grid min-w-0 max-w-xl gap-4"
              onSubmit={submit}
            >
              {step === "verify-current" || step === "verify-new" ? (
                <>
                  <p className="break-words text-sm leading-6 text-sps-muted">
                    Enter the verification code for{" "}
                    <strong className="font-medium text-sps-graphite">
                      {step === "verify-new"
                        ? newEmail.trim().toLowerCase()
                        : email}
                    </strong>
                    .
                  </p>
                  <label
                    className="grid min-w-0 gap-2 text-sm font-medium"
                    htmlFor={`${id}-code`}
                  >
                    Verification code
                    <input
                      autoFocus
                      id={`${id}-code`}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      aria-describedby={`${id}-hint`}
                      aria-invalid={Boolean(error)}
                      className={kit.field}
                      value={code}
                      onChange={(event) => {
                        setCode(event.target.value);
                        setError("");
                      }}
                    />
                  </label>
                  <p id={`${id}-hint`} className="text-xs text-sps-muted">
                    Preview code: 123456. No email is sent.
                  </p>
                  <div>
                    <Button
                      variant="plain"
                      type="button"
                      onClick={() => {
                        setResent(true);
                        setCode("");
                        setError("");
                      }}
                    >
                      Resend code
                    </Button>
                    {resent && (
                      <p role="status" className="mt-1 text-xs text-sps-muted">
                        A new preview code is ready: 123456.
                      </p>
                    )}
                  </div>
                </>
              ) : kind === "email" ? (
                <label className="grid min-w-0 gap-2 text-sm font-medium">
                  New email
                  <input
                    autoFocus
                    type="email"
                    required
                    autoComplete="email"
                    className={kit.field}
                    value={newEmail}
                    onChange={(event) => {
                      setNewEmail(event.target.value);
                      setError("");
                    }}
                  />
                </label>
              ) : (
                <>
                  <PasswordField
                    label="Current password"
                    name="current-password"
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={(event) => {
                      setCurrentPassword(event.target.value);
                      setError("");
                    }}
                  />
                  <PasswordField
                    label="New password"
                    name="new-password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      setError("");
                    }}
                  />
                  <PasswordField
                    label="Repeat new password"
                    name="repeat-password"
                    autoComplete="new-password"
                    required
                    value={repeat}
                    onChange={(event) => {
                      setRepeat(event.target.value);
                      setError("");
                    }}
                  />
                </>
              )}
              {error && (
                <p role="alert" className="text-sm text-sps-danger">
                  {error}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="submit">
                  {step === "verify-new"
                    ? "Confirm new email"
                    : step === "details"
                      ? kind === "email"
                        ? "Verify new email"
                        : "Change password"
                      : "Verify code"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    advance(
                      step === "verify-new"
                        ? "details"
                        : step === "details"
                          ? "verify-current"
                          : "start",
                    )
                  }
                >
                  Back
                </Button>
                <Button type="button" variant="plain" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}

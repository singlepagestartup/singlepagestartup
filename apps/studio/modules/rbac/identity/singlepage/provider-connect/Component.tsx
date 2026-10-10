"use client";
import { useId, useState } from "react";
import {
  Button,
  kit,
} from "../../../../../workspace/design/singlepage/interface-kit/primitives";
import { PasswordField } from "../../../../../workspace/design/singlepage/interface-kit/ai-chat/ServiceDocument";
import { getIdentityProviderMeta } from "../../../shared";
export interface IProviderConnectProps {
  provider?: string;
  account?: string;
  onComplete?: (account: string) => void;
  onCancel?: () => void;
}
export function Component({
  provider = "oauth_google",
  account = "",
  onComplete,
  onCancel,
}: IProviderConnectProps = {}) {
  const meta = getIdentityProviderMeta(provider);
  const credentials = meta.kind === "credentials";
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const wallet = provider === "ethereum_virtual_machine";
  const [stage, setStage] = useState<"account" | "approve" | "complete">(
    "account",
  );
  const [value, setValue] = useState(account);
  const id = useId();
  return (
    <section
      className="mt-5 min-w-0 rounded-xl border border-sps-line bg-sps-grey p-4 sm:p-5"
      aria-label={`Connect ${meta.title}`}
      data-ds-block="rbac.identity.provider-connect"
    >
      <h4 className="font-semibold">Connect {meta.title}</h4>
      <p className="mt-2 text-sm leading-6 text-sps-muted">
        {credentials
          ? "Add your email and password, then verify the email address."
          : wallet
            ? "Choose a wallet, then approve an ownership signature. No transaction or payment is required."
            : `Continue with ${meta.title}, then approve access to sign in.`}
      </p>
      <p className="mt-2 text-xs text-sps-muted">
        Connection preview. No external account or wallet is contacted.
      </p>
      {stage === "account" ? (
        <form
          className="mt-5 grid min-w-0 max-w-xl gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            setStage("approve");
          }}
        >
          <label
            className="grid min-w-0 gap-2 text-sm font-medium"
            htmlFor={id}
          >
            {wallet
              ? "Wallet address"
              : provider === "telegram"
                ? "Telegram username"
                : "Account email"}
            <input
              autoFocus
              id={id}
              type={
                provider === "oauth_google" || credentials ? "email" : "text"
              }
              required
              className={kit.field}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              pattern={wallet ? "0x[a-fA-F0-9]{40}" : undefined}
              placeholder={
                wallet
                  ? "0x…"
                  : provider === "telegram"
                    ? "@username"
                    : "you@example.com"
              }
            />
          </label>
          {credentials && (
            <PasswordField
              label="Password"
              name="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit">
              {credentials
                ? "Send verification code"
                : wallet
                  ? "Continue with wallet"
                  : `Continue with ${meta.title}`}
            </Button>
            <Button variant="secondary" type="button" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : stage === "approve" && credentials ? (
        <form
          className="mt-5 grid min-w-0 max-w-xl gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (code !== "123456") {
              setError("That code is incorrect. Use the preview code 123456.");
              return;
            }
            onComplete?.(value.trim().toLowerCase());
            setPassword("");
            setCode("");
            setStage("complete");
          }}
        >
          <p className="break-all text-sm">Verify {value}</p>
          <label className="grid min-w-0 gap-2 text-sm font-medium">
            Verification code
            <input
              autoFocus
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              className={kit.field}
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setError("");
              }}
            />
          </label>
          <p className="text-xs text-sps-muted">
            Preview code: 123456. No email is sent. Passwords are not stored.
          </p>
          {error && (
            <p role="alert" className="text-sm text-sps-danger">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Connect email</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setStage("account");
                setCode("");
                setError("");
              }}
            >
              Back
            </Button>
            <Button type="button" variant="plain" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : stage === "approve" ? (
        <div className="mt-5 space-y-4">
          <p className="break-all text-sm font-medium">{value}</p>
          <p className="text-sm leading-6 text-sps-muted">
            {wallet
              ? "Confirm the signature request to verify this wallet belongs to you."
              : `Approve the sign-in request for this ${meta.title} account.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                onComplete?.(value.trim());
                setStage("complete");
              }}
            >
              {wallet ? "Approve signature" : "Approve connection"}
            </Button>
            <Button variant="secondary" onClick={() => setStage("account")}>
              Back
            </Button>
            <Button variant="plain" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <p role="status" className="text-sm">
            {meta.title} connected in this preview.
          </p>
          <Button variant="secondary" onClick={onCancel}>
            Done
          </Button>
        </div>
      )}
    </section>
  );
}

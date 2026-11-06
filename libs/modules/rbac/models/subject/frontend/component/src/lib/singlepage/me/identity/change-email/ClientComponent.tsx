"use client";
import { internationalization } from "@sps/shared-configuration";
import { memo, useId, useRef, useState, type FormEvent } from "react";
import { api } from "@sps/rbac/models/subject/sdk/client";
import { Icon } from "@sps/ui-adapter";
import type { IComponentPropsExtended } from "./interface";

export const Component = memo(function Component(
  props: IComponentPropsExtended,
) {
  const language = props.language || internationalization.defaultLanguage.code;
  const ru = language === "ru";
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<
    "start" | "verify-current" | "details" | "verify-new" | "complete"
  >("start");
  const [code, setCode] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [error, setError] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const request = api.identityChangeEmailRequest();
  const verify = api.identityChangeEmailVerify();
  const pending = request.isPending || verify.isPending;
  const active = step === "details" ? 1 : step === "verify-new" ? 2 : 0;
  const button =
    "inline-flex min-h-11 max-w-full items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
  const secondary = `${button} border border-border bg-card hover:bg-muted`;
  const primary = `${button} bg-primary text-primary-foreground hover:brightness-95 focus-visible:brightness-95`;
  const field =
    "min-h-12 w-full rounded-xl border border-border bg-card px-4 text-base text-foreground outline-none focus:border-foreground focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-card disabled:opacity-50";
  function advance(next: typeof step) {
    setStep(next);
    setCode("");
    setError("");
  }
  function close() {
    setOpen(false);
    advance("start");
    setNewEmail("");
    setVerificationId("");
    setChallengeId("");
    trigger.current?.focus();
  }
  async function send(target: "current" | "new") {
    setError("");
    try {
      const result = await request.mutateAsync({
        id: props.data.id,
        identityId: props.identity.id,
        data:
          target === "new"
            ? { email: newEmail.trim().toLowerCase(), verificationId }
            : {},
      });
      setChallengeId(result.challengeId);
      advance(target === "new" ? "verify-new" : "verify-current");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : ru
            ? "Не удалось отправить письмо для подтверждения."
            : "The verification email could not be sent.",
      );
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (step === "details") {
      await send("new");
      return;
    }
    setError("");
    try {
      const result = await verify.mutateAsync({
        id: props.data.id,
        identityId: props.identity.id,
        data: { challengeId, code },
      });
      if (result.stage === "current-verified") {
        setVerificationId(result.verificationId);
        advance("details");
      } else advance("complete");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : ru
            ? "Не удалось проверить код."
            : "The code could not be verified.",
      );
    }
  }
  return (
    <div
      className={props.className}
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
      data-subject-id={props.data.id}
      data-identity-id={props.identity.id}
    >
      <button
        ref={trigger}
        type="button"
        disabled={pending}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        className={secondary}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {ru ? "Изменить почту" : "Change email"}
      </button>
      {open && (
        <section
          id={id}
          aria-label={ru ? "Изменить почту" : "Change email"}
          className="order-last mt-5 min-w-0 basis-full rounded-xl border border-border bg-muted p-4 sm:p-5"
        >
          <h4 className="text-base font-semibold">
            {ru ? "Изменить почту" : "Change email"}
          </h4>
          {step === "complete" ? (
            <div className="mt-4 space-y-4">
              <p role="status" className="text-sm">
                {ru ? "Почта изменена на" : "Email updated to"}{" "}
                {newEmail.trim().toLowerCase()}.
              </p>
              <button type="button" className={secondary} onClick={close}>
                {ru ? "Готово" : "Done"}
              </button>
            </div>
          ) : (
            <>
              <ol
                aria-label={ru ? "Этапы изменения" : "Change progress"}
                className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"
              >
                {[
                  ru ? "Подтвердите текущую почту" : "Verify current email",
                  ru ? "Новая почта" : "New email",
                  ru ? "Подтвердите новую почту" : "Verify new email",
                ].map((label, index) => (
                  <li
                    key={label}
                    aria-current={active === index ? "step" : undefined}
                    className={
                      active === index ? "font-semibold text-foreground" : ""
                    }
                  >
                    {index + 1}. {label}
                  </li>
                ))}
              </ol>
              {step === "start" ? (
                <div className="mt-5 space-y-4">
                  <p className="break-words text-sm leading-6 text-muted-foreground">
                    {ru
                      ? "Сначала подтвердите доступ к"
                      : "First, confirm access to"}{" "}
                    {props.identity.email}
                    {ru
                      ? ". Затем введите и подтвердите новый адрес почты."
                      : ". Then enter and verify your new email address."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      className={primary}
                      onClick={() => void send("current")}
                    >
                      <Icon name="envelope" className="size-4" />
                      {pending
                        ? ru
                          ? "Отправляем…"
                          : "Sending…"
                        : ru
                          ? "Отправить код подтверждения"
                          : "Send verification code"}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      className={secondary}
                      onClick={close}
                    >
                      {ru ? "Отмена" : "Cancel"}
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  key={step}
                  onSubmit={submit}
                  className="mt-5 grid min-w-0 max-w-xl gap-4"
                >
                  {step === "details" ? (
                    <label className="grid min-w-0 gap-2 text-sm font-semibold">
                      {ru ? "Новая почта" : "New email"}
                      <input
                        autoFocus
                        type="email"
                        autoComplete="email"
                        required
                        disabled={pending}
                        className={field}
                        value={newEmail}
                        onChange={(event) => {
                          setNewEmail(event.target.value);
                          setError("");
                        }}
                      />
                    </label>
                  ) : (
                    <>
                      <p className="break-words text-sm leading-6 text-muted-foreground">
                        {ru
                          ? "Введите код подтверждения, отправленный на"
                          : "Enter the verification code sent to"}{" "}
                        <strong className="font-medium text-foreground">
                          {step === "verify-new"
                            ? newEmail
                            : props.identity.email}
                        </strong>
                        .
                      </p>
                      <label
                        className="grid min-w-0 gap-2 text-sm font-semibold"
                        htmlFor={`${id}-code`}
                      >
                        {ru ? "Код подтверждения" : "Verification code"}
                        <input
                          id={`${id}-code`}
                          autoFocus
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          required
                          disabled={pending}
                          aria-describedby={`${id}-hint`}
                          aria-invalid={!!error || undefined}
                          className={field}
                          value={code}
                          onChange={(event) => {
                            setCode(event.target.value);
                            setError("");
                          }}
                        />
                      </label>
                      <p
                        id={`${id}-hint`}
                        className="text-xs text-muted-foreground"
                      >
                        {ru
                          ? "Код действует 10 минут."
                          : "The code expires in 10 minutes."}
                      </p>
                      <button
                        type="button"
                        disabled={pending}
                        className={`${button} w-fit text-muted-foreground hover:text-foreground`}
                        onClick={() =>
                          void send(step === "verify-new" ? "new" : "current")
                        }
                      >
                        {ru ? "Отправить код ещё раз" : "Resend code"}
                      </button>
                    </>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={pending}
                      className={primary}
                    >
                      {pending
                        ? ru
                          ? "Подождите…"
                          : "Please wait…"
                        : step === "verify-new"
                          ? ru
                            ? "Подтвердить новую почту"
                            : "Confirm new email"
                          : step === "details"
                            ? ru
                              ? "Подтвердите новую почту"
                              : "Verify new email"
                            : ru
                              ? "Проверить код"
                              : "Verify code"}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      className={secondary}
                      onClick={() =>
                        advance(step === "verify-new" ? "details" : "start")
                      }
                    >
                      {ru ? "Назад" : "Back"}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      className={`${button} text-muted-foreground hover:text-foreground`}
                      onClick={close}
                    >
                      {ru ? "Отмена" : "Cancel"}
                    </button>
                  </div>
                </form>
              )}
              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-destructive-border bg-destructive-surface p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
});

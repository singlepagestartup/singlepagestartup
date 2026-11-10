import Link from "next/link";
import Image from "next/image";
import { RBAC_EMAIL_PASSWORD_PATHS } from "@sps/shared-utils";
import { AuthenticationColumns } from "../content-ai-chat-authentication/Component";
import type { IComponentProps } from "./interface";

export function Component({
  language,
  action,
  variant,
  children,
}: IComponentProps) {
  const ru = language === "ru";
  const home = `/${language}`;
  const signIn = home + RBAC_EMAIL_PASSWORD_PATHS.authentication;
  const register = home + RBAC_EMAIL_PASSWORD_PATHS.registration;
  const copy = {
    authentication: ru ? "Вход в аккаунт" : "Sign in to your account",
    registration: ru ? "Создание аккаунта" : "Create your account",
    "forgot-password": ru ? "Восстановление доступа" : "Recover your account",
    "reset-password": ru ? "Новый пароль" : "Choose a new password",
  };
  const registration = action === "registration";
  const signInLabel = ru ? "Войти" : "Sign in";
  const registerLabel = ru ? "Создать аккаунт" : "Create an account";
  const photograph = registration ? "project-start-v1" : "work-in-motion";
  const brand = (
    <Link
      href={home}
      className="inline-flex min-h-11 items-center gap-2 font-semibold"
    >
      <Image
        src="/images/ai-chat/operator-logo-square-black.svg"
        width={32}
        height={32}
        alt=""
      />
      SinglePageStartup
    </Link>
  );
  return (
    <div className="flex min-h-svh flex-col bg-muted text-foreground">
      <header className="border-b border-border bg-card">
        <nav
          aria-label={ru ? "Основная навигация" : "Main navigation"}
          className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8 md:min-h-24"
        >
          {brand}
          <Link
            href={registration ? signIn : register}
            className="inline-flex min-h-11 items-center text-sm font-semibold hover:underline"
          >
            {registration ? signInLabel : registerLabel}
          </Link>
        </nav>
      </header>
      <AuthenticationColumns
        variant={variant}
        title={copy[action]}
        media={
          <Image
            src={`/images/ai-chat/singlepagestartup-photography-${photograph}-square.png`}
            width={1254}
            height={1254}
            sizes="(min-width: 760px) 34rem, 100vw"
            alt=""
            className="block aspect-square w-full object-cover"
          />
        }
      >
        {children}
      </AuthenticationColumns>
      <footer className="mx-auto mt-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-6 text-sm sm:px-8">
        {brand}
        <Link
          href={home}
          className="inline-flex min-h-11 items-center hover:underline"
        >
          {ru ? "На главную" : "Home"}
        </Link>
      </footer>
    </div>
  );
}

"use client";
import { useId, useState } from "react";
import { Select, Icon } from "@sps/ui-adapter";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getLocalizedHref } from "@sps/shared-frontend-client-utils";
import { api } from "@sps/rbac/models/subject/sdk/client";
import {
  Component as Subject,
  Component as Orders,
} from "@sps/rbac/models/subject/frontend/component";
import { internationalization } from "@sps/shared-configuration";
import type { IComponentPropsExtended, ISettingsProps } from "./interface";
export function Component(props: IComponentPropsExtended) {
  const language = props.language || internationalization.defaultLanguage.code;
  return (
    <div
      data-module="rbac"
      data-model="widget"
      data-variant={props.variant}
      data-id={props.data.id}
      className="w-full min-w-0"
    >
      <Subject
        isServer={false}
        variant="authentication-me-default"
        unauthenticatedRedirectHref={`/${language}/ai-chat/sign-in`}
      >
        {({ data, authenticated }) =>
          data && authenticated ? (
            <Settings data={data} language={language} />
          ) : null
        }
      </Subject>
    </div>
  );
}
function Settings(props: ISettingsProps) {
  const ru = props.language === "ru";
  const pathname = usePathname();
  const id = useId();
  const [section, setSection] = useState("Profile");
  const logout = api.authenticationLogout({});
  const sectionLabels: Record<string, string> = {
    Profile: ru ? "Профиль" : "Profile",
    "Sign-in methods": ru ? "Способы входа" : "Sign-in methods",
    Purchases: ru ? "Покупки" : "Purchases",
    "Data and privacy": ru ? "Данные и конфиденциальность" : "Data and privacy",
  };
  const sections = [
    "Profile",
    "Sign-in methods",
    "Purchases",
    "Data and privacy",
  ];
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {ru ? "Настройки аккаунта" : "Account settings"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {ru
              ? "Измените профиль, способы входа и проверьте данные аккаунта."
              : "Edit your profile, sign-in methods and account details."}
          </p>
        </div>
        <button
          type="button"
          disabled={logout.isPending}
          onClick={() =>
            logout.mutate({
              redirectTo: getLocalizedHref(pathname, "/ai-chat/sign-in"),
            })
          }
          className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold"
        >
          <Icon name="sign-out" className="size-4" />
          {ru ? "Выйти" : "Sign out"}
        </button>
      </header>
      <div className="grid items-start gap-6 md:grid-cols-[12rem_minmax(0,1fr)]">
        <div className="min-w-0 md:hidden">
          <label
            className="mb-2 block text-sm font-medium"
            htmlFor={`${id}-select`}
          >
            {ru ? "Раздел настроек" : "Settings section"}
          </label>
          <Select
            ui="shadcn"
            id={`${id}-select`}
            aria-label={ru ? "Раздел настроек" : "Settings section"}
            value={section}
            onValueChange={setSection}
            options={sections.map((item) => ({
              value: item,
              label: sectionLabels[item],
            }))}
          />
        </div>
        <nav
          aria-label={ru ? "Настройки" : "Settings"}
          className="sticky top-24 hidden space-y-1 md:block"
        >
          {sections.map((item) => (
            <button
              key={item}
              type="button"
              aria-current={section === item ? "page" : undefined}
              onClick={() => setSection(item)}
              className={`flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${section === item ? "bg-card" : "text-muted-foreground hover:bg-card"}`}
            >
              <span
                className={`h-5 w-1 rounded-full ${section === item ? "bg-primary text-primary-foreground" : "bg-transparent"}`}
              />
              {sectionLabels[item]}
            </button>
          ))}
        </nav>
        <section
          aria-label={
            section === "Purchases" ? undefined : sectionLabels[section]
          }
          className={
            section === "Purchases"
              ? "min-w-0"
              : "min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6"
          }
        >
          {section === "Profile" && (
            <Subject
              language={props.language}
              isServer={false}
              variant="me-social-module-profile-list-settings-ai-chat"
              data={props.data}
            />
          )}
          {section === "Sign-in methods" && (
            <Subject
              language={props.language}
              isServer={false}
              variant="me-identity-list-settings-ai-chat"
              data={props.data}
            />
          )}
          {section === "Purchases" && (
            <Orders
              language={props.language}
              isServer={false}
              variant="me-ecommerce-module-order-list-ai-chat"
              data={props.data}
            />
          )}
          {section === "Data and privacy" && (
            <>
              <h2 className="flex items-center gap-3 text-xl font-semibold">
                <span className="grid size-10 place-items-center rounded-xl bg-muted">
                  <Icon name="shield" />
                </span>
                {ru ? "Материалы и удаление" : "Materials and removal"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Для выполнения ваших запросов сервис передаёт нужные материалы
                внешним ИИ-провайдерам. Прочитайте,{" "}
                <Link
                  className="underline"
                  href={getLocalizedHref(pathname, "/privacy")}
                >
                  {ru
                    ? "как обрабатываются и хранятся ваши материалы"
                    : "how your materials are processed and stored"}
                </Link>
                .
              </p>
              <Link
                href={getLocalizedHref(pathname, "/ai-chat/projects")}
                className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-border px-4 text-sm font-semibold"
              >
                {ru ? "Мои проекты" : "Review my projects"}
              </Link>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

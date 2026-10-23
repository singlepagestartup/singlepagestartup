"use client";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Icon } from "@sps/ui-adapter";
import { api as subjectApi } from "@sps/rbac/models/subject/sdk/client";
import { api as socialProfileApi } from "@sps/social/models/profile/sdk/client";
import { NEXT_PUBLIC_API_SERVICE_URL } from "@sps/shared-utils";
import { cn } from "@sps/shared-frontend-client-utils";
import type { IComponentPropsExtended } from "./interface";

export function Component(props: IComponentPropsExtended) {
  const ru = props.language === "ru";
  if (!props.authenticated || !props.data)
    return (
      <Link
        href={`/${props.language}/rbac/subject/authentication/select-method`}
        className={cn(
          "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2",
          props.className,
        )}
      >
        <Icon name="user-circle" className="size-6" />
        <span className="hidden sm:inline">{ru ? "Войти" : "Sign in"}</span>
        <span className="sr-only sm:hidden">{ru ? "Войти" : "Sign in"}</span>
      </Link>
    );
  return (
    <Account
      key={props.data.id}
      isServer={false}
      variant={props.variant}
      data={props.data}
      authenticated
      language={props.language}
      className={props.className}
    />
  );
}

function Account(
  props: IComponentPropsExtended & {
    data: NonNullable<IComponentPropsExtended["data"]>;
  },
) {
  const ru = props.language === "ru";
  const profiles = subjectApi.socialModuleProfileFind({
    id: props.data.id,
    reactQueryOptions: { retry: false },
  });
  const personal = profiles.data?.find(
    (profile) =>
      profile.variant === "default" || profile.variant === "telegram",
  );
  const publicAuthors = socialProfileApi.authorFind({
    params: { profileId: personal?.id },
    reactQueryOptions: { enabled: !!personal?.id, retry: false },
  });
  const author = publicAuthors.isError ? undefined : publicAuthors.data?.[0];
  const avatar = subjectApi.socialModuleProfileFindByIdAvatarFind({
    id: props.data.id,
    socialModuleProfileId: personal?.id ?? "",
    reactQueryOptions: { enabled: !!personal?.id, retry: false },
  });
  const logout = subjectApi.authenticationLogout({});
  const name =
    personal?.title?.[props.language] ||
    personal?.title?.en ||
    (ru ? "Мой аккаунт" : "My account");
  const path = avatar.isError ? undefined : avatar.data?.file?.file;
  const src = path
    ? /^https?:\/\//.test(path)
      ? path
      : `${NEXT_PUBLIC_API_SERVICE_URL}/public${path}`
    : undefined;
  const menuClass =
    "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none data-highlighted:bg-muted";
  return (
    <div
      className={props.className}
      data-module="rbac"
      data-model="subject"
      data-variant={props.variant}
    >
      <DropdownMenu.Root modal={false}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label={ru ? "Меню аккаунта" : "Account menu"}
            className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-xl px-2 text-left hover:bg-muted data-[state=open]:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-muted">
              {src ? (
                <img src={src} alt="" className="size-full object-cover" />
              ) : (
                <Icon name="user-circle" className="size-6" />
              )}
            </span>
            <span className="hidden max-w-32 truncate text-sm font-semibold sm:block">
              {name}
            </span>
            <Icon name="caret-down" className="hidden size-4 sm:block" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            collisionPadding={12}
            className="z-[110] w-64 max-w-[calc(100vw-24px)] rounded-xl border border-border bg-card p-2 font-default text-foreground shadow-lg"
          >
            <DropdownMenu.Label className="break-words px-3 py-2 text-sm font-semibold">
              {name}
            </DropdownMenu.Label>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item asChild>
              <Link href={`/${props.language}/blog/new`} className={menuClass}>
                <Icon name="file-text" className="size-5" />
                {ru ? "Создать статью" : "Create article"}
              </Link>
            </DropdownMenu.Item>
            {author ? (
              <DropdownMenu.Item asChild>
                <Link
                  href={`/${props.language}/authors/${author.id}`}
                  className={menuClass}
                >
                  <Icon name="user-circle" className="size-5" />
                  {ru ? "Моя страница автора" : "My author page"}
                </Link>
              </DropdownMenu.Item>
            ) : null}
            <DropdownMenu.Item asChild>
              <Link
                href={`/${props.language}/ai-chat/projects`}
                className={menuClass}
              >
                <Icon name="chat-circle" className="size-5" />
                {ru ? "Мои чаты" : "My chats"}
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Item asChild>
              <Link
                href={`/${props.language}/ai-chat/settings`}
                className={menuClass}
              >
                <Icon name="gear-six" className="size-5" />
                {ru ? "Настройки" : "Settings"}
              </Link>
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item asChild disabled={logout.isPending}>
              <button
                type="button"
                disabled={logout.isPending}
                onClick={() =>
                  logout.mutate({ redirectTo: `/${props.language}/framework` })
                }
                className={`${menuClass} w-full disabled:opacity-50`}
              >
                <Icon name="sign-out" className="size-5" />
                {logout.isPending
                  ? ru
                    ? "Выходим…"
                    : "Signing out…"
                  : ru
                    ? "Выйти"
                    : "Sign out"}
              </button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

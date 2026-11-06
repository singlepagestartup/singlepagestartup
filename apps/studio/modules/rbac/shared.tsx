import { Component as SharedIcon } from "../shared/icon";

import { forwardRef, type SVGProps } from "react";
import { twMerge as twMerge } from "tailwind-merge";
import type IconGlyphs from "../shared/icon/singlepage/phosphor/icons.json";
import { aiChatAccount } from "./subject/singlepage/me/account/fixture";
type ModuleIcon = ReturnType<typeof createIcon>;
interface IModuleIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}
type IconName = keyof typeof IconGlyphs;
function createIcon(name: IconName) {
  const Component = forwardRef<SVGSVGElement, IModuleIconProps>(
    function ModuleGlyph({ className, size = 20, children, ...props }, ref) {
      return (
        <span className="contents">
          <Icon
            name={name}
            className={twMerge("h-5 w-5", className)}
            svgProps={{ ...props, ref, width: size, height: size }}
          />
        </span>
      );
    },
  );
  Component.displayName = `Phosphor(${name})`;
  return Component;
}
function Icon(props: {
  name: keyof typeof IconGlyphs;
  size?: 20 | 24;
  className?: string;
  svgProps?: React.SVGProps<SVGSVGElement>;
}) {
  return <SharedIcon {...props} variant="phosphor" />;
}

export interface RbacSubject {
  id: string;
  slug: string;
  variant: string;
  createdAt: string;
  updatedAt: string;
}
export interface RbacIdentity {
  id: string;
  provider: string;
  email: string;
  account: string;
  variant: string;
  createdAt: string;
  updatedAt: string;
}
export interface RbacAccountProfile {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  slug: string;
  avatar?: string;
}
export interface RbacAccountUser {
  name: string;
  email: string;
  role: string;
  avatar: string;
}
export interface RbacStudioAuthUser extends RbacAccountUser {
  slug: string;
  description?: string;
}
export type IdentityActionTone = "neutral" | "danger";
export interface IdentityAction {
  key: string;
  label: string;
  tone: IdentityActionTone;
}
export interface IdentityProviderMeta {
  key: string;
  title: string;
  kind: "credentials" | "oauth" | "external";
  kindLabel: string;
  description: string;
  icon: ModuleIcon;
}
export interface AccountMenuAction {
  key: string;
  label: string;
  href: string;
  icon: ModuleIcon;
  tone?: "neutral" | "danger";
}
export function formatRbacDateTime(value: string | undefined | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export function getIdentityProviderMeta(
  provider: string,
): IdentityProviderMeta {
  const normalized = String(provider || "unknown").toLowerCase();
  const key = normalized === "email" ? "email_and_password" : normalized;
  return (
    identityProviders.find((item) => item.key === key) ?? {
      key,
      title: key.replace(/_/g, " "),
      kind: "external",
      kindLabel: "Подключено",
      description: "Управляйте подключённым способом входа.",
      icon: KeyRound,
    }
  );
}
export function getIdentityActions(identity: RbacIdentity): IdentityAction[] {
  const providerMeta = getIdentityProviderMeta(identity.provider);
  if (providerMeta.kind === "credentials") {
    return [
      { key: "change-email", label: "Изменить почту", tone: "neutral" },
      { key: "change-password", label: "Изменить пароль", tone: "neutral" },
      { key: "delete", label: "Отключить способ входа", tone: "danger" },
    ];
  }
  return [
    { key: "reconnect", label: "Подключить заново", tone: "neutral" },
    { key: "delete", label: "Отключить способ входа", tone: "danger" },
  ];
}
export function getIdentityPrimaryLogin(identity: RbacIdentity): string {
  return (
    identity.email ||
    identity.account ||
    "Публичный аккаунт или почта не указаны"
  );
}
export function getIdentityOperationLabel(operationKey: string): string {
  if (operationKey === "change-email") return "Открыта смена почты";
  if (operationKey === "change-password") return "Открыта смена пароля";
  if (operationKey === "reconnect") return "Открыто повторное подключение";
  if (operationKey === "delete") return "Запрошено отключение способа входа";
  return "Действие со способом входа выбрано";
}
const User = createIcon("user");
const Globe = createIcon("globe");
const Wallet = createIcon("wallet");
const Shield = createIcon("shield");
const Send = createIcon("paper-plane-tilt");
const MessageSquare = createIcon("chat");
const Mail = createIcon("envelope");
const KeyRound = createIcon("key");
export const defaultRbacSubject: RbacSubject = {
  id: "973e0fde-4786-413e-bc8f-2eecf4488e9d",
  slug: "rogwild",
  variant: "default",
  createdAt: "2025-03-09T13:16:15.559Z",
  updatedAt: "2026-02-19T21:22:01.000Z",
};
export const defaultRbacUser: RbacAccountUser = {
  name: "Sarah Kim",
  email: "sarah@sps.dev",
  role: "Head of Product",
  avatar: aiChatAccount.profile.avatar!,
};
export const defaultRbacStudioAuthUsers: RbacStudioAuthUser[] = [
  {
    name: "Alex",
    email: aiChatAccount.email,
    role: "",
    slug: "alex",
    avatar: aiChatAccount.profile.avatar!,
  },
  {
    ...defaultRbacUser,
    slug: "sarah-kim",
  },
  {
    name: "James Carter",
    email: "james@sps.dev",
    role: "CTO",
    slug: "james-carter",
    avatar: aiChatAccount.profile.avatar!,
  },
  {
    name: "Marcus Webb",
    email: "marcus@sps.dev",
    role: "Lead Engineer",
    slug: "marcus-webb",
    avatar: aiChatAccount.profile.avatar!,
  },
];
export const defaultRbacIdentities: RbacIdentity[] = [
  {
    id: "f3b3934d-3199-4f04-9e8e-99c4ab0a47a1",
    provider: "email_and_password",
    email: "rogwild@sps.dev",
    account: "",
    variant: "default",
    createdAt: "2025-03-09T13:17:10.100Z",
    updatedAt: "2026-02-12T10:41:33.004Z",
  },
  {
    id: "50ec6ff5-c7a0-42fb-95f9-4d3463c3acc9",
    provider: "telegram",
    email: "",
    account: "@rogwild",
    variant: "default",
    createdAt: "2025-09-21T07:21:09.330Z",
    updatedAt: "2026-02-10T08:13:02.551Z",
  },
  {
    id: "19ad0c8c-8bc9-465e-9df9-67be202e2a4d",
    provider: "oauth_google",
    email: "rogwild@gmail.com",
    account: "rogwild@gmail.com",
    variant: "default",
    createdAt: "2026-01-04T16:55:42.223Z",
    updatedAt: "2026-02-14T10:22:20.110Z",
  },
];
export const defaultRbacProfiles: RbacAccountProfile[] = [
  {
    id: "2f6f62e1-5c1a-4fa3-983e-08469b11fa89",
    title: "Sarah Kim",
    subtitle: "Head of Product",
    description:
      "Sarah leads product strategy for SPS, turning reusable modules into fast startup prototypes.",
    slug: "sarah-kim",
    avatar: defaultRbacUser.avatar,
  },
];
export const defaultSettingsSubject: RbacSubject = {
  ...defaultRbacSubject,
  slug: "sarah-kim",
};
export const defaultSettingsIdentities: RbacIdentity[] =
  defaultRbacIdentities.map((identity) => ({
    ...identity,
    email: identity.email ? "sarah@sps.dev" : "",
    account: identity.account
      ? identity.provider === "telegram"
        ? "@sarah-kim"
        : "sarah@sps.dev"
      : "",
  }));
export const defaultAccountMenuActions: AccountMenuAction[] = [
  {
    key: "profile",
    label: "Мой профиль",
    href: "/rbac/subject/settings",
    icon: User,
  },
  {
    key: "chat",
    label: "Чат команды",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    key: "settings",
    label: "Настройки аккаунта",
    href: "/rbac/subject/settings",
    icon: Shield,
  },
  {
    key: "logout",
    label: "Выйти",
    href: "/",
    icon: KeyRound,
    tone: "danger",
  },
];
export const identityProviders: IdentityProviderMeta[] = [
  {
    key: "email_and_password",
    title: "Почта и пароль",
    kind: "credentials",
    kindLabel: "Пароль",
    description: "Войдите с помощью почты и пароля.",
    icon: Mail,
  },
  {
    key: "oauth_google",
    title: "Google",
    kind: "oauth",
    kindLabel: "Подключено",
    description: "Войдите с аккаунтом Google.",
    icon: Globe,
  },
  {
    key: "telegram",
    title: "Telegram",
    kind: "oauth",
    kindLabel: "Подключено",
    description: "Войдите с аккаунтом Telegram.",
    icon: Send,
  },
  {
    key: "ethereum_virtual_machine",
    title: "Криптокошелёк",
    kind: "external",
    kindLabel: "Wallet",
    description:
      "Подключите кошелёк и подтвердите, что он ваш, с помощью подписи.",
    icon: Wallet,
  },
];

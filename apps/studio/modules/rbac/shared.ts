import { aiChatAccount } from "../../workspace/utils/products/ai-chat-account-fixture";
import {
  KeyRound,
  Mail,
  MessageSquare,
  Send,
  Shield,
  Wallet,
  Globe,
  User,
  type ModuleIcon,
} from "../../workspace/utils/components/ModuleIcons";

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

export const RBAC_STUDIO_AUTH_STORAGE_KEY =
  "singlepagestartup_studio_auth_user";
export const RBAC_STUDIO_AUTH_CHANGE_EVENT =
  "singlepagestartup-studio-auth-change";

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

export function resolveRbacStudioAuthUser(email: string): RbacStudioAuthUser {
  const normalizedEmail = email.trim().toLowerCase();
  const emailPrefix = normalizedEmail.split("@")[0] ?? "";
  const matchedUser =
    defaultRbacStudioAuthUsers.find((user) => {
      const normalizedName = user.name.toLowerCase().replace(/\s+/g, "-");

      return (
        user.email.toLowerCase() === normalizedEmail ||
        user.slug === emailPrefix ||
        normalizedName === emailPrefix
      );
    }) ?? defaultRbacStudioAuthUsers[1];

  return {
    ...matchedUser,
    email: normalizedEmail || matchedUser.email,
  };
}

export function readRbacStudioAuthUser(): RbacStudioAuthUser | null {
  if (typeof window === "undefined") return null;

  try {
    const storedUser = window.localStorage.getItem(
      RBAC_STUDIO_AUTH_STORAGE_KEY,
    );
    if (!storedUser) return null;

    const parsedUser = JSON.parse(storedUser) as Partial<RbacStudioAuthUser>;
    if (!parsedUser || typeof parsedUser.email !== "string") return null;

    return {
      ...resolveRbacStudioAuthUser(parsedUser.email),
      ...parsedUser,
      avatar: parsedUser.avatar?.includes("images.unsplash.com")
        ? aiChatAccount.profile.avatar!
        : (parsedUser.avatar ?? aiChatAccount.profile.avatar!),
    };
  } catch {
    return null;
  }
}

export function writeRbacStudioAuthUser(
  email: string,
  updates: Partial<Omit<RbacStudioAuthUser, "email">> = {},
): RbacStudioAuthUser {
  const stored = readRbacStudioAuthUser();
  const user = {
    ...resolveRbacStudioAuthUser(email),
    ...(stored?.email === email.trim().toLowerCase() ? stored : {}),
    ...updates,
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      RBAC_STUDIO_AUTH_STORAGE_KEY,
      JSON.stringify(user),
    );
    window.dispatchEvent(
      new CustomEvent(RBAC_STUDIO_AUTH_CHANGE_EVENT, { detail: user }),
    );
  }

  return user;
}

export function clearRbacStudioAuthUser() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(RBAC_STUDIO_AUTH_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(RBAC_STUDIO_AUTH_CHANGE_EVENT));
}

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
    label: "My Profile",
    href: "/rbac/subject/settings",
    icon: User,
  },
  {
    key: "chat",
    label: "Team Chat",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    key: "settings",
    label: "Account Settings",
    href: "/rbac/subject/settings",
    icon: Shield,
  },
  {
    key: "logout",
    label: "Sign Out",
    href: "/",
    icon: KeyRound,
    tone: "danger",
  },
];

export function formatRbacDateTime(value: string | undefined | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const identityProviders: IdentityProviderMeta[] = [
  {
    key: "email_and_password",
    title: "Email & password",
    kind: "credentials",
    kindLabel: "Password",
    description: "Sign in with your email and password.",
    icon: Mail,
  },
  {
    key: "oauth_google",
    title: "Google",
    kind: "oauth",
    kindLabel: "Connected",
    description: "Use your Google account to sign in.",
    icon: Globe,
  },
  {
    key: "telegram",
    title: "Telegram",
    kind: "oauth",
    kindLabel: "Connected",
    description: "Use your Telegram account to sign in.",
    icon: Send,
  },
  {
    key: "ethereum_virtual_machine",
    title: "Crypto wallet",
    kind: "external",
    kindLabel: "Wallet",
    description: "Connect a wallet and verify ownership with a signature.",
    icon: Wallet,
  },
];

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
      kindLabel: "Connected",
      description: "Manage this connected sign-in method.",
      icon: KeyRound,
    }
  );
}

export function getIdentityActions(identity: RbacIdentity): IdentityAction[] {
  const providerMeta = getIdentityProviderMeta(identity.provider);

  if (providerMeta.kind === "credentials") {
    return [
      { key: "change-email", label: "Change email", tone: "neutral" },
      { key: "change-password", label: "Change password", tone: "neutral" },
      { key: "delete", label: "Remove identity", tone: "danger" },
    ];
  }

  return [
    { key: "reconnect", label: "Reconnect", tone: "neutral" },
    { key: "delete", label: "Remove identity", tone: "danger" },
  ];
}

export function getIdentityPrimaryLogin(identity: RbacIdentity): string {
  return identity.email || identity.account || "No public account/email stored";
}

export function getIdentityOperationLabel(operationKey: string): string {
  if (operationKey === "change-email") return "Email change flow opened";
  if (operationKey === "change-password") return "Password change flow opened";
  if (operationKey === "reconnect") return "Reconnect flow started";
  if (operationKey === "delete") return "Identity removal requested";
  return "Identity action selected";
}

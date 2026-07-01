import {
  Github,
  KeyRound,
  Mail,
  MessageSquare,
  Send,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";

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

export interface RbacSubjectToIdentity {
  id: string;
  subjectId: string;
  identityId: string;
  orderIndex: number;
  variant: string;
}

export interface RbacAccountProfile {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  relationId: string;
}

export interface RbacAccountUser {
  name: string;
  email: string;
  role: string;
  avatar: string;
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
  icon: LucideIcon;
}

export interface AccountMenuAction {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
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
  avatar:
    "https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=160",
};

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

export const defaultRbacSubjectToIdentities: RbacSubjectToIdentity[] = [
  {
    id: "b887f4ef-fca1-46cc-9f39-c988f9b0b3d5",
    subjectId: defaultRbacSubject.id,
    identityId: defaultRbacIdentities[0]?.id ?? "",
    orderIndex: 0,
    variant: "default",
  },
  {
    id: "f8082360-6ccf-44e8-a1b1-c6fc7e2f7d57",
    subjectId: defaultRbacSubject.id,
    identityId: defaultRbacIdentities[1]?.id ?? "",
    orderIndex: 1,
    variant: "default",
  },
  {
    id: "baad8824-6f51-49da-a0a7-ff8f5f5d6285",
    subjectId: defaultRbacSubject.id,
    identityId: defaultRbacIdentities[2]?.id ?? "",
    orderIndex: 2,
    variant: "default",
  },
];

export const defaultRbacProfiles: RbacAccountProfile[] = [
  {
    id: "2f6f62e1-5c1a-4fa3-983e-08469b11fa89",
    title: "Rogwild",
    subtitle: "Founder @ SinglePageStartup",
    slug: "rogwild-profile",
    relationId: "9f1c43fd-cbd8-4f59-b55f-3637804f5f32",
  },
];

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

export function getIdentityProviderMeta(
  provider: string,
): IdentityProviderMeta {
  const normalized = String(provider || "unknown").toLowerCase();

  if (normalized === "email_and_password" || normalized === "email") {
    return {
      key: normalized,
      title: "Email & Password",
      kind: "credentials",
      kindLabel: "Credentials",
      description:
        "Classic credential identity. Supports email updates and password rotation.",
      icon: Mail,
    };
  }

  if (normalized === "telegram" || normalized.includes("telegram")) {
    return {
      key: normalized,
      title: "Telegram",
      kind: "oauth",
      kindLabel: "External",
      description:
        "External provider identity resolved via Telegram account and bot auth flow.",
      icon: Send,
    };
  }

  if (
    normalized.includes("oauth") ||
    normalized.includes("google") ||
    normalized.includes("github")
  ) {
    const label = normalized
      .replace(/_/g, "-")
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    return {
      key: normalized,
      title: label,
      kind: "oauth",
      kindLabel: "External",
      description:
        "OAuth identity. Password management is handled by the upstream provider.",
      icon: Github,
    };
  }

  return {
    key: normalized,
    title: normalized
      .replace(/_/g, "-")
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" "),
    kind: "external",
    kindLabel: "External",
    description:
      "External identity provider. Available actions depend on provider capabilities.",
    icon: KeyRound,
  };
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

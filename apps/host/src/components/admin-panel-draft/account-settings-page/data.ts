export type TSubjectEntity = {
  id: string;
  slug: string;
  variant: string;
  createdAt: string;
  updatedAt: string;
};

export type TIdentityEntity = {
  id: string;
  provider: string;
  email: string;
  account: string;
  variant: string;
  createdAt: string;
  updatedAt: string;
};

export type TSubjectToIdentityEntity = {
  id: string;
  subjectId: string;
  identityId: string;
  orderIndex: number;
  variant: string;
  className: string;
};

export type TSocialProfileEntity = {
  id: string;
  adminTitle: string;
  title: Record<string, string>;
  subtitle: Record<string, string>;
  description: Record<string, string>;
  slug: string;
  variant: string;
  createdAt: string;
  updatedAt: string;
};

export type TSubjectToSocialProfileEntity = {
  id: string;
  subjectId: string;
  socialModuleProfileId: string;
  orderIndex: number;
  variant: string;
  className: string;
};

export const accountSubject: TSubjectEntity = {
  id: "973e0fde-4786-413e-bc8f-2eecf4488e9d",
  slug: "rogwild",
  variant: "default",
  createdAt: "2025-03-09T13:16:15.559Z",
  updatedAt: "2026-02-19T21:22:01.000Z",
};

export const accountIdentities: TIdentityEntity[] = [
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

export const accountSubjectsToIdentities: TSubjectToIdentityEntity[] = [
  {
    id: "b887f4ef-fca1-46cc-9f39-c988f9b0b3d5",
    subjectId: accountSubject.id,
    identityId: accountIdentities[0].id,
    orderIndex: 0,
    variant: "default",
    className: "",
  },
  {
    id: "f8082360-6ccf-44e8-a1b1-c6fc7e2f7d57",
    subjectId: accountSubject.id,
    identityId: accountIdentities[1].id,
    orderIndex: 1,
    variant: "default",
    className: "",
  },
  {
    id: "baad8824-6f51-49da-a0a7-ff8f5f5d6285",
    subjectId: accountSubject.id,
    identityId: accountIdentities[2].id,
    orderIndex: 2,
    variant: "default",
    className: "",
  },
];

export const accountSocialProfiles: TSocialProfileEntity[] = [
  {
    id: "2f6f62e1-5c1a-4fa3-983e-08469b11fa89",
    adminTitle: "Rogwild Profile",
    title: {
      en: "Rogwild",
      ru: "Рогвилд",
    },
    subtitle: {
      en: "Founder @ SinglePageStartup",
      ru: "Основатель @ SinglePageStartup",
    },
    description: {
      en: "Public profile for social interactions in SPS.",
      ru: "Публичный профиль для социальных взаимодействий в SPS.",
    },
    slug: "rogwild-profile",
    variant: "default",
    createdAt: "2025-06-01T12:12:01.002Z",
    updatedAt: "2026-02-16T09:45:40.120Z",
  },
];

export const accountSubjectsToSocialProfiles: TSubjectToSocialProfileEntity[] =
  [
    {
      id: "9f1c43fd-cbd8-4f59-b55f-3637804f5f32",
      subjectId: accountSubject.id,
      socialModuleProfileId: accountSocialProfiles[0].id,
      orderIndex: 0,
      variant: "default",
      className: "",
    },
  ];

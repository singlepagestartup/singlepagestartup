import type { IResult as ISubjectResult } from "@sps/rbac/models/subject/sdk/server";
import { getRequiredEnv } from "./env";
import { expectOk } from "./http";

type TAuthenticationPayload = {
  data?: {
    jwt?: string;
  };
};

type TMePayload = {
  data?: ISubjectResult["IAuthenticationMeResult"];
};

export type TScenarioSubject = {
  id: string;
  subject: NonNullable<ISubjectResult["IAuthenticationMeResult"]>;
  jwt: string;
  email: string;
};

export async function authenticateScenarioSubject(): Promise<TScenarioSubject> {
  const email = getRequiredEnv("RBAC_SUBJECT_IDENTITY_EMAIL");
  const password = getRequiredEnv("RBAC_SUBJECT_IDENTITY_PASSWORD");

  const auth = await expectOk<TAuthenticationPayload>({
    method: "POST",
    path: "/api/rbac/subjects/authentication/email-and-password/authentication",
    data: {
      login: email,
      password,
    },
  });

  const jwt = auth.payload?.data?.jwt;

  if (!jwt) {
    throw new Error(
      `Authentication payload does not include JWT: ${JSON.stringify(auth.payload)}`,
    );
  }

  const me = await expectOk<TMePayload>({
    method: "GET",
    path: "/api/rbac/subjects/authentication/me",
    token: jwt,
  });

  const subject = me.payload?.data;

  if (!subject?.id) {
    throw new Error(
      `Authentication me payload does not include subject id: ${JSON.stringify(me.payload)}`,
    );
  }

  return {
    id: subject.id,
    subject,
    jwt,
    email,
  };
}

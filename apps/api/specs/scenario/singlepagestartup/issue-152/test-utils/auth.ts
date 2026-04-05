import { getRequiredEnv } from "./env";
import { expectOk } from "./http";

type TAuthenticationPayload = {
  data?: {
    jwt?: string;
  };
};

type TMePayload = {
  data?: {
    id?: string;
  };
};

export type TScenarioSubject = {
  id: string;
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

  const subjectId = me.payload?.data?.id;

  if (!subjectId) {
    throw new Error(
      `Authentication me payload does not include subject id: ${JSON.stringify(me.payload)}`,
    );
  }

  return {
    id: subjectId,
    jwt,
    email,
  };
}

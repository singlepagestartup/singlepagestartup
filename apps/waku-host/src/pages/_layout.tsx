import "../../../host/styles/fonts.css";
import "../../../host/styles/tailwind.css";

import http from "node:http";
import https from "node:https";
import { ReactNode, Suspense } from "react";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { YandexMetrika } from "@sps/shared-third-parties";
import { Toaster } from "@sps/shared-ui-shadcn";
import {
  GOOGLE_ANALYTICS_ID,
  GOOGLE_TAG_MANAGER_ID,
  YANDEX_METRIKA_ID,
} from "@sps/shared-utils";
import Loading from "../../../host/app/loading";
import { Component as Revalidation } from "../../../host/src/components/revalidation";
import { GoogleAnalytics } from "../components/GoogleAnalytics";
import { GoogleTagManager } from "../components/GoogleTagManager";

http.globalAgent.maxSockets = 1000;
https.globalAgent.maxSockets = 1000;

export default async function RootLayout(props: { children: ReactNode }) {
  return (
    <>
      {GOOGLE_TAG_MANAGER_ID ? <GoogleTagManager /> : null}
      {YANDEX_METRIKA_ID ? <YandexMetrika id={YANDEX_METRIKA_ID} /> : null}
      <Suspense fallback={<Loading />}>
        <RbacSubject isServer={false} variant="authentication-init-default" />
        <Revalidation isServer={true} />
        <div className="relative min-h-screen">
          {props.children}
          <Toaster />
        </div>
      </Suspense>
      {GOOGLE_ANALYTICS_ID ? <GoogleAnalytics /> : null}
    </>
  );
}

export const getConfig = async () => {
  return {
    render: "dynamic",
  } as const;
};

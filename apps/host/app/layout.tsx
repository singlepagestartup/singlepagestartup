/**
 * Required for image-generator, without importing fonts.css compilled fonts
 * have random hash names <hash>.p.ttf, not Bold.<hash>.ttf
 */
import "../styles/fonts.css";
import "../styles/tailwind.css";

import { fonts } from "./fonts";
import React, { Suspense } from "react";
import { Toaster } from "@sps/shared-ui-shadcn";
import { Component as Admin } from "../src/components/admin";
import { Component as RbacSubject } from "@sps/rbac/models/subject/frontend/component";
import Loading from "./loading";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";
import {
  GOOGLE_ANALYTICS_ID,
  GOOGLE_TAG_MANAGER_ID,
  YANDEX_METRIKA_ID,
} from "@sps/shared-utils";
import { Component as Revalidation } from "../src/components/revalidation";
import http from "http";
import https from "https";
import { YandexMetrika } from "@sps/shared-third-parties";

http.globalAgent.maxSockets = 1000;
https.globalAgent.maxSockets = 1000;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className="scroll-smooth">
      {GOOGLE_TAG_MANAGER_ID ? (
        <GoogleTagManager gtmId={GOOGLE_TAG_MANAGER_ID} />
      ) : null}
      {YANDEX_METRIKA_ID ? <YandexMetrika id={YANDEX_METRIKA_ID} /> : null}
      <body
        className={`${fonts.defaultFont.variable} ${fonts.primaryFont.variable}`}
      >
        <Suspense fallback={<Loading />}>
          <RbacSubject isServer={false} variant="authentication-init-default" />
          <Revalidation isServer={true} />
          <Admin isServer={true} />
          <div className="relative">
            {children}
            <Toaster />
          </div>
        </Suspense>
      </body>
      {GOOGLE_ANALYTICS_ID ? (
        <GoogleAnalytics gaId={GOOGLE_ANALYTICS_ID} />
      ) : null}
    </html>
  );
}

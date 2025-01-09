/**
 * Required for image-generator, without importing fonts.css compilled fonts
 * have random hash names <hash>.p.ttf, not Bold.<hash>.ttf
 */
import "../styles/fonts.css";
import "../styles/tailwind.scss";

import { fonts } from "./fonts";
import { Suspense } from "react";
import { Toaster } from "@sps/shared-ui-shadcn";
import { Component as Admin } from "../src/components/admin";
import { Component as SpsRbacSubject } from "@sps/rbac/models/subject/frontend/component";
import { Provider as SpsRbacProvider } from "@sps/rbac/frontend/component";
import { App as SpsBroadcast } from "@sps/broadcast/frontend/component";
import Loading from "./loading";
import { GoogleTagManager, GoogleAnalytics } from "@next/third-parties/google";
import { GOOGLE_ANALYTICS_ID, GOOGLE_TAG_MANAGER_ID } from "@sps/shared-utils";

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
      <body
        className={`${fonts.defaultFont.variable} ${fonts.primaryFont.variable}`}
      >
        <Suspense fallback={<Loading />}>
          <SpsRbacProvider isServer={false} hostUrl="/">
            <SpsRbacSubject
              isServer={false}
              hostUrl="/"
              variant="authentication-init-default"
            />
            <SpsBroadcast hostUrl="/" isServer={true} />
            <Admin hostUrl="/" isServer={true} />
            <div className="relative">
              {children}
              <Toaster />
            </div>
          </SpsRbacProvider>
        </Suspense>
      </body>
      {GOOGLE_ANALYTICS_ID ? (
        <GoogleAnalytics gaId={GOOGLE_ANALYTICS_ID} />
      ) : null}
    </html>
  );
}

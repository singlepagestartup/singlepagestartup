import { GOOGLE_ANALYTICS_ID } from "@sps/shared-utils";

export function GoogleAnalytics() {
  if (!GOOGLE_ANALYTICS_ID) {
    return null;
  }

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: [
            "window.dataLayer = window.dataLayer || [];",
            "function gtag(){dataLayer.push(arguments);}",
            "gtag('js', new Date());",
            `gtag('config', '${GOOGLE_ANALYTICS_ID}');`,
          ].join("\n"),
        }}
      />
    </>
  );
}

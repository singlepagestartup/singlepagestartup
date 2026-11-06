import "../styles/fonts.css";
import "../styles/tailwind.css";
import { internationalization } from "@sps/shared-configuration";

export default function GlobalNotFound() {
  return (
    <html lang={internationalization.defaultLanguage.code}>
      <head>
        <title>404 — Not found</title>
        <meta name="robots" content="noindex" />
      </head>
      <body>
        <main className="flex min-h-screen items-center justify-center">
          <h1 className="text-4xl font-bold">Not found</h1>
        </main>
      </body>
    </html>
  );
}

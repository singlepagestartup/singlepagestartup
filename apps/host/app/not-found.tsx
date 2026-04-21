import { internationalization } from "@sps/shared-configuration";
import { renderSitePageByUrl } from "../src/runtime/site";

export default async function NotFoundPage() {
  const notFoundPage = await renderSitePageByUrl({
    url: "/404",
    language: internationalization.defaultLanguage.code,
    isAdminRoute: false,
  });

  if (!notFoundPage) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <p className="font-bold text-4xl">Not found</p>
      </div>
    );
  }

  return notFoundPage;
}

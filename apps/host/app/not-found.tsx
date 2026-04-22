import { internationalization } from "@sps/shared-configuration";
import { renderFragmentSitePageByUrl } from "../src/fragments";

export default async function NotFoundPage() {
  const notFoundPage = await renderFragmentSitePageByUrl({
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

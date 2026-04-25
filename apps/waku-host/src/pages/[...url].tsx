import type { PageProps } from "waku/router";
import { ClientRedirect } from "../components/ClientRedirect";
import { PrefixedHostPage } from "../components/PrefixedHostPage";
import {
  DEFAULT_LANGUAGE,
  buildLocalizedPath,
  getLocalizedRoute,
} from "../lib/routing";

export default async function UnprefixedCatchAllPage({
  url,
}: PageProps<"/[...url]">) {
  const localizedRoute = getLocalizedRoute(url);

  if (localizedRoute.hasLanguagePrefix) {
    return (
      <PrefixedHostPage
        language={localizedRoute.language}
        slashedUrl={localizedRoute.slashedUrl}
      />
    );
  }

  const target = buildLocalizedPath(DEFAULT_LANGUAGE, url);

  return (
    <>
      <ClientRedirect to={target} />
      <PrefixedHostPage
        language={localizedRoute.language}
        slashedUrl={localizedRoute.slashedUrl}
      />
    </>
  );
}

export const getConfig = async () => {
  return {
    render: "dynamic",
  } as const;
};

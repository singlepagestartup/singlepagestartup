import { ClientRedirect } from "../components/ClientRedirect";
import { PrefixedHostPage } from "../components/PrefixedHostPage";
import { DEFAULT_LANGUAGE, buildLocalizedPath } from "../lib/routing";

export default async function RootIndexPage() {
  const target = buildLocalizedPath(DEFAULT_LANGUAGE);

  return (
    <>
      <ClientRedirect to={target} />
      <PrefixedHostPage language={DEFAULT_LANGUAGE} slashedUrl="/" />
    </>
  );
}

export const getConfig = async () => {
  return {
    render: "dynamic",
  } as const;
};

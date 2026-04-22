import {
  findFragmentRouteHandler,
  firstSearchParam,
  SpsComponentTarget,
} from "@sps/shared-fragments";

import { ecommerceFragmentRegistry } from "../../../../../../src/fragments/registry";

export const dynamic = "force-dynamic";

function UnsupportedFragment(props: { target: SpsComponentTarget }) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <section className="w-full rounded-lg border border-dashed border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="font-medium">Unsupported ecommerce fragment</p>
      <p className="text-xs opacity-80">
        {props.target.kind}:{props.target.name}:{props.target.variant}
      </p>
    </section>
  );
}

export default async function EcommerceFragmentPage(props: {
  params: Promise<SpsComponentTarget>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const target: SpsComponentTarget = {
    kind: params.kind,
    name: params.name,
    variant: params.variant,
  };
  const handler = findFragmentRouteHandler(ecommerceFragmentRegistry, target);
  const language = firstSearchParam(searchParams, "language") || "en";
  const contextUrl = firstSearchParam(searchParams, "contextUrl") || "/";

  return (
    <main data-sps-fragment-root>
      {handler ? (
        await handler({
          contextUrl,
          language,
          searchParams,
        })
      ) : (
        <UnsupportedFragment target={target} />
      )}
    </main>
  );
}

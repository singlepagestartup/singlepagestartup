import {
  extractFragmentRootHtml,
  SpsComponentTarget,
  SpsFragmentModule,
} from "@sps/shared-fragments";

const moduleOrigins: Record<SpsFragmentModule, string> = {
  ecommerce:
    process.env.SPS_ECOMMERCE_ORIGIN ||
    process.env.ECOMMERCE_FRAGMENT_ORIGIN ||
    "http://localhost:3010",
  rbac:
    process.env.SPS_RBAC_ORIGIN ||
    process.env.RBAC_FRAGMENT_ORIGIN ||
    "http://localhost:3011",
};

export function isSupportedFragmentModule(
  module: string,
): module is SpsFragmentModule {
  return module in moduleOrigins;
}

function encodePathPart(value: string) {
  return encodeURIComponent(value);
}

export function componentFragmentUrl(props: {
  module: SpsFragmentModule;
  target: SpsComponentTarget;
  searchParams: Record<string, string | undefined>;
}) {
  const url = new URL(
    `/sps/fragments/${encodePathPart(props.target.kind)}/${encodePathPart(
      props.target.name,
    )}/${encodePathPart(props.target.variant)}`,
    moduleOrigins[props.module],
  );

  Object.entries(props.searchParams).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}

export async function renderRemoteComponentFragment(props: {
  module: SpsFragmentModule;
  target: SpsComponentTarget;
  searchParams: Record<string, string | undefined>;
}) {
  const url = componentFragmentUrl(props);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Fragment route failed: ${response.status} ${url}`);
    }

    return extractFragmentRootHtml(await response.text());
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[site-fragments] ${
          error instanceof Error ? error.message : "Unknown fragment failure"
        }`,
      );
    }

    return "";
  }
}

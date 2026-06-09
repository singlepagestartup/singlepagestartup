import type { ReactNode } from "react";

export type SpsFragmentModule = "ecommerce" | "rbac";

export type SpsComponentTarget = {
  kind: "model" | "relation";
  name: string;
  variant: string;
};

export type SpsFragmentTarget = SpsComponentTarget & {
  module: SpsFragmentModule;
};

export type FragmentRenderContext = {
  url: string;
  language: string;
  isServer: true;
};

export type FragmentAsset = {
  type: "script" | "style";
  href: string;
  module?: boolean;
};

export type FragmentRenderedSlot = {
  html: string;
  assets?: FragmentAsset[];
};

export type FragmentQueryRequest = {
  target: SpsFragmentTarget;
  context: FragmentRenderContext;
  props: {
    apiProps?: unknown;
    data?: unknown;
    [key: string]: unknown;
  };
};

export type FragmentQueryResponse = {
  data: unknown[];
  warnings?: string[];
};

export type FragmentRenderRequest = {
  target: SpsFragmentTarget;
  context: FragmentRenderContext;
  props: Record<string, unknown>;
  slots?: Record<string, FragmentRenderedSlot[]>;
};

export type FragmentRenderResponse = {
  html: string;
  assets: FragmentAsset[];
  warnings?: string[];
};

export type FragmentRouteSearchParams = Record<
  string,
  string | string[] | undefined
>;

export type FragmentRouteHandlerInput = {
  contextUrl: string;
  data?: unknown;
  language: string;
  searchParams: FragmentRouteSearchParams;
};

export type FragmentRouteHandler = (
  input: FragmentRouteHandlerInput,
) => Promise<ReactNode>;

export type FragmentRouteRegistry = Partial<
  Record<
    SpsComponentTarget["kind"],
    Record<string, Record<string, FragmentRouteHandler>>
  >
>;

export function emptyFragmentResponse(warning: string): FragmentRenderResponse {
  return {
    html: "",
    assets: [],
    warnings: [warning],
  };
}

export function firstSearchParam(
  searchParams: FragmentRouteSearchParams,
  key: string,
) {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function findFragmentRouteHandler(
  registry: FragmentRouteRegistry,
  target: SpsComponentTarget,
) {
  return registry[target.kind]?.[target.name]?.[target.variant];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyReactStreamReplacements(html: string) {
  const segments = new Map<string, string>();
  const pairs: Array<{ boundaryId: string; segmentId: string }> = [];
  const segmentPattern =
    /<div hidden(?:="")? id="(S:\d+)">([\s\S]*?)<\/div><script>\$RC\("(B:\d+)","\1"\)<\/script>/g;
  const pairPattern = /\$RC\("(B:\d+)","(S:\d+)"\)/g;
  let segmentMatch: RegExpExecArray | null;
  let pairMatch: RegExpExecArray | null;

  while ((segmentMatch = segmentPattern.exec(html))) {
    segments.set(segmentMatch[1], segmentMatch[2]);
  }

  while ((pairMatch = pairPattern.exec(html))) {
    pairs.push({
      boundaryId: pairMatch[1],
      segmentId: pairMatch[2],
    });
  }

  return pairs.reduce((acc, pair) => {
    const segment = segments.get(pair.segmentId);

    if (!segment) {
      return acc;
    }

    const boundaryId = escapeRegExp(pair.boundaryId);

    return acc
      .replace(
        new RegExp(
          `<!--\\$\\?--><template id="${boundaryId}"></template><!--/\\$-->`,
          "g",
        ),
        segment,
      )
      .replace(
        new RegExp(`<template id="${boundaryId}"></template>`, "g"),
        segment,
      );
  }, html);
}

export function extractFragmentRootHtml(html: string) {
  const normalizedHtml = applyReactStreamReplacements(html);
  const match = normalizedHtml.match(
    /<main\b[^>]*data-sps-fragment-root(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?[^>]*>([\s\S]*?)<\/main>/i,
  );

  return match?.[1]?.trim() || "";
}

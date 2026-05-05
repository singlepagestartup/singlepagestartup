import {
  HostGraphPreviewInputSchema,
  IHostGraphLocalizedFieldUpdateInput,
  IHostGraphPreviewInput,
} from "./schemas";
import { getMcpSdkOptions } from "./auth";
import {
  contentEntityRegistry,
  requireContentEntityDescriptor,
} from "./registry";
import {
  IContentEntityDescriptor,
  IContentEntityKey,
  IContentQueryParams,
  IHostGraphCandidate,
  IHostGraphResult,
} from "./types";

export interface IHostGraphOptions {
  registry?: IContentEntityDescriptor[];
  authHeaders?: Record<string, string>;
}

function normalizeUrl(url: string) {
  if (!url.trim()) {
    return "/";
  }

  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;

  if (normalizedUrl.length > 1 && normalizedUrl.endsWith("/")) {
    return normalizedUrl.slice(0, -1);
  }

  return normalizedUrl;
}

function getStringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function getId(record: Record<string, any> | undefined) {
  return getStringValue(record?.id);
}

function getLocalizedValue(value: unknown, language: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return;
  }

  const localizedValue = (value as Record<string, unknown>)[language];

  return getStringValue(localizedValue);
}

function buildFilterParams(filters: IContentQueryParams["filters"]) {
  return {
    filters,
    limit: 100,
  };
}

async function findPageByUrl(props: {
  url: string;
  descriptor: IContentEntityDescriptor;
  authHeaders: Record<string, string>;
}) {
  if (props.descriptor.api.findByUrl) {
    try {
      const page = await props.descriptor.api.findByUrl({
        url: props.url,
        catchErrors: true,
        silentErrorStatuses: [404],
        options: getMcpSdkOptions(props.authHeaders),
      });

      if (page?.id) {
        return page;
      }
    } catch {
      // Fall back to the generic filtered find path.
    }
  }

  const pages = await props.descriptor.api.find({
    params: buildFilterParams({
      and: [
        {
          column: "url",
          method: "eq",
          value: props.url,
        },
      ],
    }),
    options: getMcpSdkOptions(props.authHeaders),
  });

  return pages?.[0];
}

async function findByFilters(props: {
  descriptor: IContentEntityDescriptor;
  params: IContentQueryParams;
  authHeaders: Record<string, string>;
}) {
  return (
    (await props.descriptor.api.find({
      params: props.params,
      options: getMcpSdkOptions(props.authHeaders),
    })) ?? []
  );
}

async function findById(props: {
  descriptor: IContentEntityDescriptor;
  id: string;
  authHeaders: Record<string, string>;
}) {
  return await props.descriptor.api.findById({
    id: props.id,
    options: getMcpSdkOptions(props.authHeaders),
  });
}

async function resolveExternalWidget(props: {
  externalWidgetRelation: Record<string, any>;
  registry: IContentEntityDescriptor[];
  authHeaders: Record<string, string>;
}) {
  if (props.externalWidgetRelation.externalModule !== "blog") {
    return;
  }

  const descriptor = requireContentEntityDescriptor(
    "blog.widget",
    props.registry,
  );
  const externalWidgetId = getStringValue(
    props.externalWidgetRelation.externalWidgetId,
  );

  if (!externalWidgetId) {
    return;
  }

  const widget = await findById({
    descriptor,
    id: externalWidgetId,
    authHeaders: props.authHeaders,
  });

  return {
    entityKey: "blog.widget" as const,
    widget,
  };
}

function summarizeCandidate(props: {
  page: Record<string, any>;
  pageWidget: Record<string, any>;
  hostWidget?: Record<string, any>;
  externalWidgetRelation?: Record<string, any>;
  externalEntityKey?: IContentEntityKey;
  externalWidget?: Record<string, any>;
  language: string;
}): IHostGraphCandidate {
  const externalWidgetId =
    getId(props.externalWidget) ??
    getStringValue(props.externalWidgetRelation?.externalWidgetId);

  return {
    id:
      externalWidgetId ??
      getId(props.externalWidgetRelation) ??
      getId(props.hostWidget) ??
      getId(props.pageWidget) ??
      getId(props.page) ??
      "",
    page: props.page,
    pageWidget: props.pageWidget,
    hostWidget: props.hostWidget,
    externalWidgetRelation: props.externalWidgetRelation,
    externalEntityKey: props.externalEntityKey,
    externalWidget: props.externalWidget,
    summary: {
      pageUrl: getStringValue(props.page.url),
      pageId: getId(props.page),
      pageWidgetId: getId(props.pageWidget),
      hostWidgetId: getId(props.hostWidget),
      externalRelationId: getId(props.externalWidgetRelation),
      externalModule: getStringValue(
        props.externalWidgetRelation?.externalModule,
      ),
      externalWidgetId,
      adminTitle:
        getStringValue(props.externalWidget?.adminTitle) ??
        getStringValue(props.hostWidget?.adminTitle),
      title:
        getLocalizedValue(props.externalWidget?.title, props.language) ??
        getLocalizedValue(props.hostWidget?.title, props.language) ??
        getStringValue(props.page.title),
      slug:
        getStringValue(props.externalWidget?.slug) ??
        getStringValue(props.hostWidget?.slug),
      variant:
        getStringValue(props.externalWidget?.variant) ??
        getStringValue(props.hostWidget?.variant),
    },
  };
}

function getCandidateSearchValues(candidate: IHostGraphCandidate) {
  return [
    candidate.id,
    candidate.summary.pageWidgetId,
    candidate.summary.hostWidgetId,
    candidate.summary.externalRelationId,
    candidate.summary.externalWidgetId,
    candidate.summary.adminTitle,
    candidate.summary.title,
    candidate.summary.slug,
    candidate.summary.variant,
  ].filter((value): value is string => Boolean(value));
}

function matchStatus(count: number): IHostGraphResult["matchStatus"] {
  if (count === 0) {
    return "none";
  }

  if (count === 1) {
    return "single";
  }

  return "multiple";
}

export function filterHostGraphCandidates(props: {
  candidates: IHostGraphCandidate[];
  targetText?: string;
  widgetId?: string;
  candidateId?: string;
}) {
  const explicitId = props.candidateId ?? props.widgetId;

  if (explicitId) {
    return props.candidates.filter((candidate) => {
      return getCandidateSearchValues(candidate).includes(explicitId);
    });
  }

  if (!props.targetText) {
    return props.candidates;
  }

  const normalizedTarget = props.targetText.trim().toLowerCase();

  const exactIdMatches = props.candidates.filter((candidate) => {
    return getCandidateSearchValues(candidate).some((value) => {
      return value.toLowerCase() === normalizedTarget;
    });
  });

  if (exactIdMatches.length) {
    return exactIdMatches;
  }

  return props.candidates.filter((candidate) => {
    return getCandidateSearchValues(candidate).some((value) => {
      return value.toLowerCase().includes(normalizedTarget);
    });
  });
}

export async function resolveHostGraph(
  input: IHostGraphPreviewInput | unknown,
  options?: IHostGraphOptions,
): Promise<IHostGraphResult> {
  const parsed = HostGraphPreviewInputSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  const registry = options?.registry ?? contentEntityRegistry;
  const authHeaders = options?.authHeaders ?? {};
  const url = normalizeUrl(parsed.data.url);
  const pageDescriptor = requireContentEntityDescriptor("host.page", registry);
  const pageWidgetsDescriptor = requireContentEntityDescriptor(
    "host.pages-to-widgets",
    registry,
  );
  const hostWidgetDescriptor = requireContentEntityDescriptor(
    "host.widget",
    registry,
  );
  const externalWidgetDescriptor = requireContentEntityDescriptor(
    "host.widgets-to-external-widgets",
    registry,
  );

  const page = await findPageByUrl({
    url,
    descriptor: pageDescriptor,
    authHeaders,
  });

  if (!page?.id) {
    return {
      url,
      language: parsed.data.language,
      candidates: [],
      matchStatus: "none",
    };
  }

  const pageWidgets = await findByFilters({
    descriptor: pageWidgetsDescriptor,
    params: {
      filters: {
        and: [
          {
            column: "pageId",
            method: "eq",
            value: page.id,
          },
        ],
      },
      orderBy: {
        and: [
          {
            column: "orderIndex",
            method: "asc",
          },
        ],
      },
      limit: 100,
    },
    authHeaders,
  });

  const candidates: IHostGraphCandidate[] = [];

  for (const pageWidget of pageWidgets) {
    const widgetId = getStringValue(pageWidget.widgetId);
    const hostWidget = widgetId
      ? await findById({
          descriptor: hostWidgetDescriptor,
          id: widgetId,
          authHeaders,
        })
      : undefined;

    if (!hostWidget?.id) {
      candidates.push(
        summarizeCandidate({
          page,
          pageWidget,
          hostWidget,
          language: parsed.data.language,
        }),
      );
      continue;
    }

    const externalWidgetRelations = await findByFilters({
      descriptor: externalWidgetDescriptor,
      params: {
        filters: {
          and: [
            {
              column: "widgetId",
              method: "eq",
              value: hostWidget.id,
            },
          ],
        },
        orderBy: {
          and: [
            {
              column: "orderIndex",
              method: "asc",
            },
          ],
        },
        limit: 100,
      },
      authHeaders,
    });

    if (!externalWidgetRelations.length) {
      candidates.push(
        summarizeCandidate({
          page,
          pageWidget,
          hostWidget,
          language: parsed.data.language,
        }),
      );
      continue;
    }

    for (const externalWidgetRelation of externalWidgetRelations) {
      if (
        parsed.data.externalModule &&
        externalWidgetRelation.externalModule !== parsed.data.externalModule
      ) {
        continue;
      }

      const externalWidget = await resolveExternalWidget({
        externalWidgetRelation,
        registry,
        authHeaders,
      });

      candidates.push(
        summarizeCandidate({
          page,
          pageWidget,
          hostWidget,
          externalWidgetRelation,
          externalEntityKey: externalWidget?.entityKey,
          externalWidget: externalWidget?.widget,
          language: parsed.data.language,
        }),
      );
    }
  }

  const matchedCandidates = filterHostGraphCandidates({
    candidates,
    targetText: parsed.data.targetText,
    widgetId: parsed.data.widgetId,
  });

  return {
    url,
    language: parsed.data.language,
    page,
    candidates: matchedCandidates,
    matchStatus: matchStatus(matchedCandidates.length),
  };
}

export function requireSingleHostGraphCandidate(props: {
  result: IHostGraphResult;
  input: Pick<IHostGraphLocalizedFieldUpdateInput, "candidateId" | "widgetId">;
}) {
  const candidates = filterHostGraphCandidates({
    candidates: props.result.candidates,
    candidateId: props.input.candidateId,
    widgetId: props.input.widgetId,
  });

  if (candidates.length !== 1) {
    throw new Error(
      `Validation error. Expected exactly one host graph candidate, found ${candidates.length}`,
    );
  }

  return candidates[0];
}

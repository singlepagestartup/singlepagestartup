export interface IProjectTaskRoute {
  intent: string;
  read: string[];
  createOrChange: string[];
  verify: string[];
}

export interface IProjectGuide {
  project: {
    name: string;
    purpose: string;
    repositoryShape: string[];
  };
  mcpBoundary: {
    manages: string[];
    doesNotManage: string[];
    sourceCodeTaskRule: string;
  };
  architecture: {
    entitySystem: string[];
    backend: string[];
    frontend: string[];
    documentationOrder: string[];
  };
  contentComposition: {
    principle: string;
    pageGraph: string[];
    warning: string;
  };
  taskWorkflow: string[];
  taskRoutes: IProjectTaskRoute[];
  nonNegotiableRules: string[];
  guidanceEndpoints: {
    tools: string[];
    resources: string[];
    prompt: string;
  };
}

export interface IContentOperationFlow {
  operation: string;
  steps: string[];
}

export interface IContentOperationsGuide {
  protocol: string[];
  connectorInvariant: string;
  ambiguityRule: string;
  phases: Array<{
    phase: string;
    requirements: string[];
  }>;
  statuses: Array<{
    status: "VERIFIED" | "NOT_APPLIED" | "UNKNOWN";
    meaning: string;
  }>;
  operationFlows: IContentOperationFlow[];
  reportFields: string[];
  antiPatterns: string[];
}

export const PROJECT_GUIDE_RESOURCE_URI = "singlepagestartup://project-guide";
export const CONTENT_OPERATIONS_GUIDE_RESOURCE_URI =
  "singlepagestartup://content-operations-guide";

export const MUTATION_SAFETY_DESCRIPTION =
  " Read project-guide and content-operations-guide first. Safety: read and impact-check first; dry-run and commit through this same connector and tool; read back and compare persisted state; an ambiguous response means UNKNOWN.";

export const DELETE_SAFETY_DESCRIPTION =
  " Read project-guide and content-operations-guide first. Safety: read and impact-check first; use the matching delete preview and its exact confirmation token through this same connector; read back to confirm absence; an ambiguous response means UNKNOWN.";

export const SPS_PROJECT_GUIDE: IProjectGuide = {
  project: {
    name: "SinglePageStartup",
    purpose:
      "A modular Nx framework for building API-backed web products from reusable business modules, explicit models, and explicit relations.",
    repositoryShape: [
      "apps/api is the only hosted Bun + Hono backend application.",
      "apps/host is the Next.js App Router frontend.",
      "apps/mcp exposes compact, authenticated content and data operations through the same SDK/API runtime path as the application.",
      "libs/modules/<module>/models/<model> owns business entities.",
      "libs/modules/<module>/relations/<relation> owns links between entities.",
    ],
  },
  mcpBoundary: {
    manages: [
      "Discovering modules, models, relations, schemas, fields, variants, and supported operations.",
      "Reading, counting, finding, creating, updating, and deleting SinglePageStartup model and relation records.",
      "Resolving page composition graphs and safely updating localized page content.",
      "Creating file-storage.file records from public URLs or base64 content.",
    ],
    doesNotManage: [
      "Editing TypeScript, React, Tailwind, migrations, deployment files, or other source code.",
      "Bypassing apps/api, SDK providers, RBAC, validation, or relation models with direct database writes.",
      "Inventing modules, entities, fields, variants, or relation semantics that are absent from MCP discovery and schema results.",
    ],
    sourceCodeTaskRule:
      "If the requested outcome requires new behavior, UI, schema, middleware, or deployment changes rather than data changes, state that MCP cannot perform the source-code change. A code-capable agent must read repository documentation and modify the owning source module instead.",
  },
  architecture: {
    entitySystem: [
      "Models own records and their fields.",
      "Relations are first-class records that own links between models.",
      "Cross-module links are represented by named relation entities; do not emulate a relation by guessing foreign-key fields on a model.",
      "Use module-list, then model-schema or relation-schema, before constructing queries or writes.",
    ],
    backend: [
      "The backend layering order is Repository -> Service -> Controller -> App.",
      "Only apps/api/app.ts hosts the Hono backend.",
      "Module route middleware belongs in the module backend middleware package; controllers compose routes, middleware instances, and handlers.",
      "Schema changes use the matching Nx repository-generate target. Migration SQL and Drizzle journal/snapshot files are not handwritten.",
      "Repository data snapshots are not edited to implement runtime behavior or UI fixes.",
    ],
    frontend: [
      "Frontend data access uses module SDK providers: Provider, clientApi, serverApi, or the matching model/relation SDK.",
      'Relation components use variant="find" and filters in apiProps.params.filters.and.',
      "TailwindCSS and the shared shadcn preset are used instead of ad-hoc CSS.",
      "Component variants follow interface.ts -> index.tsx -> Component.tsx, with ClientComponent.tsx only when a client boundary is required.",
    ],
    documentationOrder: [
      "Read the root README.md or AI_GUIDE.md for repository-wide context.",
      "Read libs/modules/<module>/README.md for module ownership and concepts.",
      "Read the selected model or relation README.md for entity-specific behavior.",
      "Inspect targeted source code only after documentation does not answer the question.",
    ],
  },
  contentComposition: {
    principle:
      "Visible page content is composed through host records and explicit relations to external module widgets.",
    pageGraph: [
      "Create or select the external content widget in its owning module, for example website-builder.widget or blog.widget.",
      "Create or select the host.widget that acts as the page composition container.",
      "Relate host.page to host.widget through host.pages-to-widgets.",
      "Relate host.widget to the external widget through host.widgets-to-external-widgets.",
    ],
    warning:
      "Creating only a host.widget or only an external widget is insufficient; the page graph must be complete for content to render.",
  },
  taskWorkflow: [
    "Read project-guide before the first SinglePageStartup operation in a task.",
    "Classify the task as runtime data/content work or source-code work.",
    "For data/content work, call module-list and the relevant model-schema or relation-schema.",
    "Resolve exact records with count/find/get or resolve a URL with page-preview.",
    "Inspect relation and shared-entity impact before every mutation.",
    "Read content-operations-guide and follow its full mutation protocol.",
    "Report verified persisted state, not only the mutation response.",
  ],
  taskRoutes: [
    {
      intent: "Inspect existing business data or configuration",
      read: [
        "module-list",
        "model-schema or relation-schema",
        "model-record-count/find/get or relation-record-count/find/get",
      ],
      createOrChange: [
        "No write unless the user explicitly requested a change.",
      ],
      verify: ["Cite the exact selector, id, and fields returned by MCP."],
    },
    {
      intent: "Create a business entity",
      read: [
        "model-schema",
        "model-record-find using the natural key to prevent duplicates",
        "relation schemas required to connect the new record",
      ],
      createOrChange: [
        "Dry-run model-record-create, then commit through the same connector and tool.",
        "Create explicit relation records required to place or associate the entity.",
      ],
      verify: [
        "Read the returned model id.",
        "Read every created relation and confirm the complete graph.",
      ],
    },
    {
      intent: "Change an existing entity",
      read: [
        "model-schema or relation-schema",
        "get the exact target id",
        "find relations that reference the target",
      ],
      createOrChange: [
        "Patch only requested fields.",
        "Dry-run and commit through the same connector and tool.",
      ],
      verify: [
        "Read the same id back and compare requested fields.",
        "Confirm related records were not changed outside the approved impact.",
      ],
    },
    {
      intent: "Change text or content visible at a URL",
      read: [
        "page-preview with the URL and optional language, externalModule, targetText, or widgetId",
        "select exactly one external widget candidate and capture its externalSelector and externalWidget.id",
        "model-schema for the selected external model, then model-record-get for the exact widget id",
      ],
      createOrChange: [
        "Build a model-record-update patch containing the complete current localized object with only the requested locale changed.",
        "Call model-record-update with dryRun true, then commit the identical selector, id, and data with dryRun false.",
      ],
      verify: [
        "Run model-record-get for the same id and page-preview for the same URL.",
        "Compare the target locale and confirm other locales remain unchanged.",
      ],
    },
    {
      intent: "Connect or disconnect entities",
      read: [
        "relation-schema",
        "get both endpoint records",
        "find existing matching relations",
      ],
      createOrChange: [
        "Create, update, or delete the explicit relation record.",
        "Do not patch guessed relation fields onto model records.",
      ],
      verify: ["Read or find the exact relation after the operation."],
    },
    {
      intent:
        "Change application behavior, UI, schema, middleware, or deployment",
      read: [
        "AI_GUIDE.md",
        "root README.md",
        "owning module and entity README files",
        "targeted source files",
      ],
      createOrChange: [
        "Use a code-capable repository workflow; MCP content tools are not a source-code editor.",
      ],
      verify: [
        "Run the owning Nx tests, TypeScript, ESLint, and scenario checks appropriate to the change.",
      ],
    },
  ],
  nonNegotiableRules: [
    "Do not guess when discovery, schema, record identity, or impact is ambiguous.",
    "Do not change a shared entity without enumerating all linked records and confirming broader impact.",
    "Do not switch connector namespaces between dry-run, commit, and read-back.",
    "Do not report success until persisted state has been read back and compared.",
    "Do not report connector unavailability from an empty or malformed write response; the operation status is UNKNOWN until read-back.",
    "Do not retry an unverified create before searching for the potentially created record.",
    "Do not expose or store JWTs, RBAC secrets, OAuth tokens, or other credentials in tool arguments or repository files.",
  ],
  guidanceEndpoints: {
    tools: [
      "project-guide",
      "content-operations-guide",
      "module-list",
      "model-schema",
      "relation-schema",
    ],
    resources: [
      PROJECT_GUIDE_RESOURCE_URI,
      CONTENT_OPERATIONS_GUIDE_RESOURCE_URI,
      "singlepagestartup://modules",
    ],
    prompt: "solve-singlepagestartup-task",
  },
};

export const SPS_CONTENT_OPERATIONS_GUIDE: IContentOperationsGuide = {
  protocol: [
    "READ",
    "IMPACT CHECK",
    "DRY-RUN",
    "COMMIT",
    "READ-BACK",
    "COMPARE",
  ],
  connectorInvariant:
    "Dry-run, commit, and read-back use the same MCP connector. Commit reuses the same write tool, selector, id, and data; only dryRun changes from true to false.",
  ambiguityRule:
    "An empty, truncated, malformed, timed-out, or otherwise unclear response is UNKNOWN. It does not prove success, failure, or connector unavailability. Read back through the original connector before retrying or reporting.",
  phases: [
    {
      phase: "READ",
      requirements: [
        "Read the schema and exact current record.",
        "For creates, search by the natural key before creating.",
        "Refine or ask when more than one plausible record matches.",
      ],
    },
    {
      phase: "IMPACT CHECK",
      requirements: [
        "Inspect relations that reference the target.",
        "Enumerate every linked record affected by a shared entity change.",
        "Obtain confirmation when actual impact is broader than the request.",
      ],
    },
    {
      phase: "DRY-RUN",
      requirements: [
        "Pass dryRun: true explicitly.",
        "Compare the validated selector, id, and data with the requested change.",
      ],
    },
    {
      phase: "COMMIT",
      requirements: [
        "Use the same connector and write tool.",
        "Reuse selector, id, and data from dry-run.",
        "Run a new dry-run if the payload changes.",
      ],
    },
    {
      phase: "READ-BACK",
      requirements: [
        "Read the affected id or page candidate through the original connector.",
        "For creates, read the returned id.",
        "For deletes, confirm exact absence with get or filtered find.",
      ],
    },
    {
      phase: "COMPARE",
      requirements: [
        "Compare persisted values with expected values.",
        "Report VERIFIED only when they match exactly.",
      ],
    },
  ],
  statuses: [
    {
      status: "VERIFIED",
      meaning:
        "Read-back succeeded and persisted state matches the requested result exactly.",
    },
    {
      status: "NOT_APPLIED",
      meaning: "Read-back succeeded and proves the requested change is absent.",
    },
    {
      status: "UNKNOWN",
      meaning: "Read-back could not establish persisted state.",
    },
  ],
  operationFlows: [
    {
      operation: "create",
      steps: [
        "schema",
        "uniqueness read",
        "impact check",
        "dry-run create",
        "commit create",
        "get returned id",
        "compare",
      ],
    },
    {
      operation: "update",
      steps: [
        "schema",
        "get",
        "impact check",
        "dry-run update",
        "commit update",
        "get",
        "compare",
      ],
    },
    {
      operation: "delete",
      steps: [
        "get",
        "impact check",
        "delete preview",
        "review record and relation context",
        "delete apply with exact confirmationToken",
        "get/find",
        "confirm absence",
      ],
    },
    {
      operation: "localized page field update",
      steps: [
        "page-preview",
        "select one candidate and capture externalSelector plus externalWidget.id",
        "model-schema",
        "model-record-get",
        "impact check",
        "merge the target locale into the complete current localized object",
        "model-record-update dry-run",
        "model-record-update commit with identical selector, id, and data",
        "model-record-get",
        "page-preview",
        "compare target and preserved locales",
      ],
    },
  ],
  reportFields: [
    "connector",
    "module and model/relation selector",
    "record or candidate id",
    "impact",
    "before value",
    "expected value",
    "read-back value",
    "VERIFIED, NOT_APPLIED, or UNKNOWN status",
  ],
  antiPatterns: [
    "Switching connector or tool namespace after dry-run.",
    "Using a generic tool router as a substitute for the selected connector.",
    "Blindly replaying a write after an ambiguous response.",
    "Reporting success from the commit response without read-back.",
    "Reporting connector failure from an unverified hypothesis.",
    "Changing shared data without enumerating linked records.",
    "Creating only part of the relations required for a page or business graph.",
  ],
};

export const SPS_MCP_SERVER_INSTRUCTIONS = [
  "You are connected to the SinglePageStartup runtime content and data MCP.",
  "Before the first SinglePageStartup operation for a task, call project-guide. Before any create, update, or delete, call content-operations-guide.",
  "Use module-list and then model-schema or relation-schema; never invent modules, entities, fields, variants, or relation semantics.",
  "Models own entities. Relations are first-class records that own links. Visible page content requires the complete host.page -> host.pages-to-widgets -> host.widget -> host.widgets-to-external-widgets -> external widget graph.",
  "This MCP changes runtime data through apps/api and cannot edit source code. Behavior, UI, schema, middleware, or deployment tasks require a code-capable repository workflow.",
  "For every mutation use READ -> IMPACT CHECK -> DRY-RUN -> COMMIT through the same connector and write tool -> READ-BACK through that connector -> COMPARE.",
  "An ambiguous response means UNKNOWN. Do not retry before read-back and do not report success or connector unavailability without evidence.",
  "Before changing a shared entity, enumerate linked records and obtain confirmation when impact is broader than the request.",
].join("\n");

export function createSolveSpsTaskPrompt(task: string) {
  return [
    "Solve the following SinglePageStartup task using the connected SinglePageStartup MCP:",
    task,
    "",
    "Required procedure:",
    "1. Read project-guide and classify the request as runtime data/content work or source-code work.",
    "2. If it is source-code work, explain that MCP cannot edit code and identify the owning module/docs a code-capable agent must inspect.",
    "3. If it is data/content work, call module-list and the relevant model-schema or relation-schema.",
    "4. Resolve exact records and inspect relation/shared-entity impact.",
    "5. Before any mutation, read content-operations-guide and follow READ -> IMPACT CHECK -> DRY-RUN -> COMMIT -> READ-BACK -> COMPARE without changing connector namespaces.",
    "6. Read back persisted state and report VERIFIED, NOT_APPLIED, or UNKNOWN.",
  ].join("\n");
}

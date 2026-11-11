import {
  McpServer,
  type ToolCallback,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  ContentModelCountInputSchema,
  ContentModelCreateInputSchema,
  ContentModelDeleteApplyInputSchema,
  ContentModelDeletePreviewInputSchema,
  ContentModelFindInputSchema,
  ContentModelGetByIdInputSchema,
  ContentModelSelectorSchema,
  ContentModelUpdateInputSchema,
  ContentRelationCountInputSchema,
  ContentRelationCreateInputSchema,
  ContentRelationDeleteApplyInputSchema,
  ContentRelationDeletePreviewInputSchema,
  ContentRelationFindInputSchema,
  ContentRelationGetByIdInputSchema,
  ContentRelationSelectorSchema,
  ContentRelationUpdateInputSchema,
  HostGraphPreviewInputSchema,
} from "./lib/content-management/schemas";
import {
  applyDeleteContentModelRecord,
  applyDeleteContentRelationRecord,
  countContentModelRecords,
  countContentRelationRecords,
  createContentModelRecord,
  createContentRelationRecord,
  describeContentEntities,
  describeContentModel,
  describeContentRelation,
  findContentModelRecords,
  findContentRelationRecords,
  getContentModelRecordById,
  getContentRelationRecordById,
  previewDeleteContentModelRecord,
  previewDeleteContentRelationRecord,
  updateContentModelRecord,
  updateContentRelationRecord,
} from "./lib/content-management/operations";
import {
  okEnvelope,
  okResponse,
  unknownErrorResponse,
} from "./lib/content-management/response";
import { resolveHostGraph } from "./lib/content-management/host-graph";
import { getMcpAuthHeaders } from "./lib/content-management/auth";
import {
  CONTENT_OPERATIONS_GUIDE_RESOURCE_URI,
  createSolveSpsTaskPrompt,
  DELETE_SAFETY_DESCRIPTION,
  MUTATION_SAFETY_DESCRIPTION,
  PROJECT_GUIDE_RESOURCE_URI,
  SPS_CONTENT_OPERATIONS_GUIDE,
  SPS_PROJECT_GUIDE,
} from "./lib/guidance";

type ToolHandler = ToolCallback<z.ZodRawShape>;

function withAuth(handler: ToolHandler): ToolHandler {
  return async (args, extra) => {
    try {
      return await handler(args, extra);
    } catch (error) {
      return unknownErrorResponse(error);
    }
  };
}

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "project-guide",
    PROJECT_GUIDE_RESOURCE_URI,
    {
      title: "SinglePageStartup project guide",
      description:
        "Project architecture, MCP boundaries, content composition, task routing, documentation order, and non-negotiable SinglePageStartup rules. Read this before the first SinglePageStartup operation in a task.",
      mimeType: "application/json",
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(
              okEnvelope("project-guide", SPS_PROJECT_GUIDE),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  mcp.registerResource(
    "content-operations-guide",
    CONTENT_OPERATIONS_GUIDE_RESOURCE_URI,
    {
      title: "SinglePageStartup content operations guide",
      description:
        "Required read, impact-check, dry-run, commit, read-back, compare, ambiguity, and reporting protocol for SinglePageStartup mutations.",
      mimeType: "application/json",
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(
              okEnvelope(
                "content-operations-guide",
                SPS_CONTENT_OPERATIONS_GUIDE,
              ),
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  mcp.registerResource(
    "module-list",
    "singlepagestartup://modules",
    {
      title: "SinglePageStartup modules",
      description:
        "Discover modules with nested model and relation summaries for compact MCP tools.",
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(
              okEnvelope("module-list", describeContentEntities()),
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}

export function registerTools(mcp: McpServer) {
  mcp.registerTool(
    "project-guide",
    {
      title: "Read SinglePageStartup project guide",
      description:
        "Read this first for every SinglePageStartup task. Returns project architecture, MCP boundaries, content composition, task routing, documentation order, and non-negotiable rules.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      inputSchema: {},
    },
    async () => okResponse("project-guide", SPS_PROJECT_GUIDE),
  );

  mcp.registerTool(
    "content-operations-guide",
    {
      title: "Read SinglePageStartup content operations guide",
      description:
        "Read this before every SinglePageStartup create, update, or delete. Returns the required same-connector mutation protocol, ambiguity handling, verification statuses, operation flows, and anti-patterns.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      inputSchema: {},
    },
    async () =>
      okResponse("content-operations-guide", SPS_CONTENT_OPERATIONS_GUIDE),
  );

  mcp.registerTool(
    "module-list",
    {
      title: "List SinglePageStartup modules",
      description:
        "After reading project-guide, list modules with nested models and relations available through compact SinglePageStartup MCP tools.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      inputSchema: {},
    },
    withAuth(async () => okResponse("module-list", describeContentEntities())),
  );

  mcp.registerTool(
    "model-schema",
    {
      title: "Describe SinglePageStartup model schema",
      description:
        "Return fields, required fields, localized fields, variants, examples, and supported operations for one model.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      inputSchema: ContentModelSelectorSchema.shape,
    },
    withAuth(async (args) => {
      const schema = await describeContentModel(args);

      return okResponse("model-schema", schema);
    }),
  );

  mcp.registerTool(
    "relation-schema",
    {
      title: "Describe SinglePageStartup relation schema",
      description:
        "Return fields, relation fields, variants, examples, and supported operations for one relation.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      inputSchema: ContentRelationSelectorSchema.shape,
    },
    withAuth(async (args) => {
      const schema = await describeContentRelation(args);

      return okResponse("relation-schema", schema);
    }),
  );

  mcp.registerTool(
    "model-record-count",
    {
      title: "Count SinglePageStartup model records",
      description: "Count records for one model with optional filters.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      inputSchema: ContentModelCountInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      const count = await countContentModelRecords(args, { authHeaders });

      return okResponse("model-record-count", count);
    }),
  );

  mcp.registerTool(
    "model-record-find",
    {
      title: "Find SinglePageStartup model records",
      description:
        "Find records for one model with filters, order, limit, and offset.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      inputSchema: ContentModelFindInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      const records = await findContentModelRecords(args, { authHeaders });

      return okResponse("model-record-find", records);
    }),
  );

  mcp.registerTool(
    "model-record-get",
    {
      title: "Get SinglePageStartup model record",
      description: "Get one model record by id.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      inputSchema: ContentModelGetByIdInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      const record = await getContentModelRecordById(args, { authHeaders });

      return okResponse("model-record-get", record);
    }),
  );

  mcp.registerTool(
    "model-record-create",
    {
      title: "Create SinglePageStartup model record",
      description: `Create one model record. dryRun defaults to true; set dryRun to false to write.${MUTATION_SAFETY_DESCRIPTION}`,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: true,
      },
      inputSchema: ContentModelCreateInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      const record = await createContentModelRecord(args, { authHeaders });

      return okResponse("model-record-create", record);
    }),
  );

  mcp.registerTool(
    "model-record-update",
    {
      title: "Update SinglePageStartup model record",
      description: `Update one model record. dryRun defaults to true; set dryRun to false to write.${MUTATION_SAFETY_DESCRIPTION}`,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: true,
      },
      inputSchema: ContentModelUpdateInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      const record = await updateContentModelRecord(args, { authHeaders });

      return okResponse("model-record-update", record);
    }),
  );

  mcp.registerTool(
    "model-record-delete-preview",
    {
      title: "Preview SinglePageStartup model delete",
      description:
        "Read a model record and return the confirmation token required by model-record-delete-apply.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      inputSchema: ContentModelDeletePreviewInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      const preview = await previewDeleteContentModelRecord(args, {
        authHeaders,
      });

      return okResponse("model-record-delete-preview", preview);
    }),
  );

  mcp.registerTool(
    "model-record-delete-apply",
    {
      title: "Apply SinglePageStartup model delete",
      description: `Delete a model record only after model-record-delete-preview returned a matching confirmation token.${DELETE_SAFETY_DESCRIPTION}`,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: true,
      },
      inputSchema: ContentModelDeleteApplyInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      const deletion = await applyDeleteContentModelRecord(args, {
        authHeaders,
      });

      return okResponse("model-record-delete-apply", deletion);
    }),
  );

  mcp.registerTool(
    "relation-record-count",
    {
      title: "Count SinglePageStartup relation records",
      description: "Count records for one relation with optional filters.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      inputSchema: ContentRelationCountInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      const count = await countContentRelationRecords(args, { authHeaders });

      return okResponse("relation-record-count", count);
    }),
  );

  mcp.registerTool(
    "relation-record-find",
    {
      title: "Find SinglePageStartup relation records",
      description:
        "Find records for one relation with filters, order, limit, and offset.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      inputSchema: ContentRelationFindInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      const records = await findContentRelationRecords(args, { authHeaders });

      return okResponse("relation-record-find", records);
    }),
  );

  mcp.registerTool(
    "relation-record-get",
    {
      title: "Get SinglePageStartup relation record",
      description: "Get one relation record by id.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      inputSchema: ContentRelationGetByIdInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      const record = await getContentRelationRecordById(args, { authHeaders });

      return okResponse("relation-record-get", record);
    }),
  );

  mcp.registerTool(
    "relation-record-create",
    {
      title: "Create SinglePageStartup relation record",
      description: `Create one relation record. dryRun defaults to true; set dryRun to false to write.${MUTATION_SAFETY_DESCRIPTION}`,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: true,
      },
      inputSchema: ContentRelationCreateInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      const record = await createContentRelationRecord(args, { authHeaders });

      return okResponse("relation-record-create", record);
    }),
  );

  mcp.registerTool(
    "relation-record-update",
    {
      title: "Update SinglePageStartup relation record",
      description: `Update one relation record. dryRun defaults to true; set dryRun to false to write.${MUTATION_SAFETY_DESCRIPTION}`,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: true,
      },
      inputSchema: ContentRelationUpdateInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      const record = await updateContentRelationRecord(args, { authHeaders });

      return okResponse("relation-record-update", record);
    }),
  );

  mcp.registerTool(
    "relation-record-delete-preview",
    {
      title: "Preview SinglePageStartup relation delete",
      description:
        "Read a relation record and return the confirmation token required by relation-record-delete-apply.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      inputSchema: ContentRelationDeletePreviewInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      const preview = await previewDeleteContentRelationRecord(args, {
        authHeaders,
      });

      return okResponse("relation-record-delete-preview", preview);
    }),
  );

  mcp.registerTool(
    "relation-record-delete-apply",
    {
      title: "Apply SinglePageStartup relation delete",
      description: `Delete a relation record only after relation-record-delete-preview returned a matching confirmation token.${DELETE_SAFETY_DESCRIPTION}`,
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: true,
      },
      inputSchema: ContentRelationDeleteApplyInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      const deletion = await applyDeleteContentRelationRecord(args, {
        authHeaders,
      });

      return okResponse("relation-record-delete-apply", deletion);
    }),
  );

  mcp.registerTool(
    "page-preview",
    {
      title: "Preview SinglePageStartup page content graph",
      description:
        "Resolve a page URL through page widgets, host widgets and external widget relations. Include one level of widgets-to-website-builder-module-widgets content links when available. Read-only; other relations use relation-record tools.",
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
      inputSchema: HostGraphPreviewInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      const preview = await resolveHostGraph(args, { authHeaders });

      return okResponse("page-preview", preview);
    }),
  );
}

export function registerPrompts(mcp: McpServer) {
  mcp.registerPrompt(
    "solve-singlepagestartup-task",
    {
      title: "Solve a SinglePageStartup task safely",
      description:
        "Prepare an AI model to classify and solve a SinglePageStartup task using project guidance, entity discovery, explicit relations, impact checks, and verified mutations.",
      argsSchema: {
        task: z.string().min(1).describe("The SinglePageStartup task to solve"),
      },
    },
    ({ task }) => {
      return {
        description: "SinglePageStartup task-solving workflow",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: createSolveSpsTaskPrompt(task),
            },
          },
        ],
      };
    },
  );
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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
  HostGraphLocalizedFieldUpdateInputSchema,
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
  errorResponse,
  okEnvelope,
  okResponse,
  unknownErrorResponse,
} from "./lib/content-management/response";
import {
  requireSingleHostGraphCandidate,
  resolveHostGraph,
} from "./lib/content-management/host-graph";
import {
  getMcpAuthHeaders,
  getMcpSdkOptions,
} from "./lib/content-management/auth";
import { requireContentModelDescriptor } from "./lib/content-management/registry";
import { buildLocalizedFieldPatch } from "./lib/content-management/localized-field";

type ToolHandler = Parameters<McpServer["registerTool"]>[2];

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
    "module-list",
    "sps://modules",
    {
      title: "SPS modules",
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
    "module-list",
    {
      title: "List SPS modules",
      description:
        "List modules with nested models and relations available through compact SPS MCP tools.",
      inputSchema: {},
    },
    withAuth(async () => okResponse("module-list", describeContentEntities())),
  );

  mcp.registerTool(
    "model-schema",
    {
      title: "Describe SPS model schema",
      description:
        "Return fields, required fields, localized fields, variants, examples, and supported operations for one model.",
      inputSchema: ContentModelSelectorSchema.shape,
    },
    withAuth(async (args) =>
      okResponse("model-schema", await describeContentModel(args)),
    ),
  );

  mcp.registerTool(
    "relation-schema",
    {
      title: "Describe SPS relation schema",
      description:
        "Return fields, relation fields, variants, examples, and supported operations for one relation.",
      inputSchema: ContentRelationSelectorSchema.shape,
    },
    withAuth(async (args) =>
      okResponse("relation-schema", await describeContentRelation(args)),
    ),
  );

  mcp.registerTool(
    "model-record-count",
    {
      title: "Count SPS model records",
      description: "Count records for one model with optional filters.",
      inputSchema: ContentModelCountInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      return okResponse(
        "model-record-count",
        await countContentModelRecords(args, { authHeaders }),
      );
    }),
  );

  mcp.registerTool(
    "model-record-find",
    {
      title: "Find SPS model records",
      description:
        "Find records for one model with filters, order, limit, and offset.",
      inputSchema: ContentModelFindInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      return okResponse(
        "model-record-find",
        await findContentModelRecords(args, { authHeaders }),
      );
    }),
  );

  mcp.registerTool(
    "model-record-get",
    {
      title: "Get SPS model record",
      description: "Get one model record by id.",
      inputSchema: ContentModelGetByIdInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      return okResponse(
        "model-record-get",
        await getContentModelRecordById(args, { authHeaders }),
      );
    }),
  );

  mcp.registerTool(
    "model-record-create",
    {
      title: "Create SPS model record",
      description:
        "Create one model record. dryRun defaults to true; set dryRun to false to write.",
      inputSchema: ContentModelCreateInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      return okResponse(
        "model-record-create",
        await createContentModelRecord(args, { authHeaders }),
      );
    }),
  );

  mcp.registerTool(
    "model-record-update",
    {
      title: "Update SPS model record",
      description:
        "Update one model record. dryRun defaults to true; set dryRun to false to write.",
      inputSchema: ContentModelUpdateInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      return okResponse(
        "model-record-update",
        await updateContentModelRecord(args, { authHeaders }),
      );
    }),
  );

  mcp.registerTool(
    "model-record-delete-preview",
    {
      title: "Preview SPS model delete",
      description:
        "Read a model record and return the confirmation token required by model-record-delete-apply.",
      inputSchema: ContentModelDeletePreviewInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      return okResponse(
        "model-record-delete-preview",
        await previewDeleteContentModelRecord(args, { authHeaders }),
      );
    }),
  );

  mcp.registerTool(
    "model-record-delete-apply",
    {
      title: "Apply SPS model delete",
      description:
        "Delete a model record only after model-record-delete-preview returned a matching confirmation token.",
      inputSchema: ContentModelDeleteApplyInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      return okResponse(
        "model-record-delete-apply",
        await applyDeleteContentModelRecord(args, { authHeaders }),
      );
    }),
  );

  mcp.registerTool(
    "relation-record-count",
    {
      title: "Count SPS relation records",
      description: "Count records for one relation with optional filters.",
      inputSchema: ContentRelationCountInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      return okResponse(
        "relation-record-count",
        await countContentRelationRecords(args, { authHeaders }),
      );
    }),
  );

  mcp.registerTool(
    "relation-record-find",
    {
      title: "Find SPS relation records",
      description:
        "Find records for one relation with filters, order, limit, and offset.",
      inputSchema: ContentRelationFindInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      return okResponse(
        "relation-record-find",
        await findContentRelationRecords(args, { authHeaders }),
      );
    }),
  );

  mcp.registerTool(
    "relation-record-get",
    {
      title: "Get SPS relation record",
      description: "Get one relation record by id.",
      inputSchema: ContentRelationGetByIdInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      return okResponse(
        "relation-record-get",
        await getContentRelationRecordById(args, { authHeaders }),
      );
    }),
  );

  mcp.registerTool(
    "relation-record-create",
    {
      title: "Create SPS relation record",
      description:
        "Create one relation record. dryRun defaults to true; set dryRun to false to write.",
      inputSchema: ContentRelationCreateInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      return okResponse(
        "relation-record-create",
        await createContentRelationRecord(args, { authHeaders }),
      );
    }),
  );

  mcp.registerTool(
    "relation-record-update",
    {
      title: "Update SPS relation record",
      description:
        "Update one relation record. dryRun defaults to true; set dryRun to false to write.",
      inputSchema: ContentRelationUpdateInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      return okResponse(
        "relation-record-update",
        await updateContentRelationRecord(args, { authHeaders }),
      );
    }),
  );

  mcp.registerTool(
    "relation-record-delete-preview",
    {
      title: "Preview SPS relation delete",
      description:
        "Read a relation record and return the confirmation token required by relation-record-delete-apply.",
      inputSchema: ContentRelationDeletePreviewInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      return okResponse(
        "relation-record-delete-preview",
        await previewDeleteContentRelationRecord(args, { authHeaders }),
      );
    }),
  );

  mcp.registerTool(
    "relation-record-delete-apply",
    {
      title: "Apply SPS relation delete",
      description:
        "Delete a relation record only after relation-record-delete-preview returned a matching confirmation token.",
      inputSchema: ContentRelationDeleteApplyInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      return okResponse(
        "relation-record-delete-apply",
        await applyDeleteContentRelationRecord(args, { authHeaders }),
      );
    }),
  );

  mcp.registerTool(
    "page-preview",
    {
      title: "Preview SPS page content graph",
      description:
        "Resolve a page URL into page widgets, host widgets, external widget relations, and supported content candidates.",
      inputSchema: HostGraphPreviewInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const authHeaders = getMcpAuthHeaders(extra);

      return okResponse(
        "page-preview",
        await resolveHostGraph(args, { authHeaders }),
      );
    }),
  );

  mcp.registerTool(
    "page-localized-field-update",
    {
      title: "Update localized field through SPS page graph",
      description:
        "Resolve a page URL and unambiguous external widget candidate, then dry-run or apply a locale-safe field update.",
      inputSchema: HostGraphLocalizedFieldUpdateInputSchema.shape,
    },
    withAuth(async (args, extra) => {
      const parsed = HostGraphLocalizedFieldUpdateInputSchema.safeParse(args);

      if (!parsed.success) {
        return errorResponse("validation", parsed.error.message);
      }

      const authHeaders = getMcpAuthHeaders(extra);
      const graph = await resolveHostGraph(parsed.data, { authHeaders });
      const candidate = requireSingleHostGraphCandidate({
        result: graph,
        input: parsed.data,
      });

      if (!candidate.externalSelector || !candidate.externalWidget?.id) {
        return errorResponse(
          "validation",
          "Resolved page candidate does not include a supported external model record",
          { candidate },
        );
      }

      const descriptor = await requireContentModelDescriptor(
        candidate.externalSelector,
      );
      const data = buildLocalizedFieldPatch({
        descriptor,
        current: candidate.externalWidget,
        field: parsed.data.field,
        locale: parsed.data.locale,
        value: parsed.data.value,
      });

      if (parsed.data.dryRun) {
        return okResponse("page-localized-field-update", {
          operation: "page-localized-field-update",
          dryRun: true,
          graph,
          candidate,
          before: candidate.externalWidget[parsed.data.field],
          after: data[parsed.data.field],
          data,
        });
      }

      const updated = await descriptor.api.update({
        id: candidate.externalWidget.id,
        data,
        options: getMcpSdkOptions(authHeaders),
      });

      return okResponse("page-localized-field-update", {
        operation: "page-localized-field-update",
        dryRun: false,
        graph,
        candidate,
        before: candidate.externalWidget[parsed.data.field],
        after: updated?.[parsed.data.field],
        data: updated,
      });
    }),
  );
}

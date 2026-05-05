import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  ContentCountInputSchema,
  ContentCreateInputSchema,
  ContentDeleteApplyInputSchema,
  ContentDeletePreviewInputSchema,
  ContentEntityDescribeInputSchema,
  ContentFindInputSchema,
  ContentGetByIdInputSchema,
  ContentUpdateInputSchema,
  HostGraphLocalizedFieldUpdateInputSchema,
  HostGraphPreviewInputSchema,
  LocalizedFieldUpdateInputSchema,
} from "./lib/content-management/schemas";
import {
  applyDeleteContentRecord,
  countContentRecords,
  createContentRecord,
  describeContentEntities,
  describeContentEntity,
  findContentRecords,
  getContentRecordById,
  previewDeleteContentRecord,
  updateContentRecord,
  updateLocalizedContentField,
} from "./lib/content-management/operations";
import {
  contentEntityRegistry,
  listContentEntities,
  requireContentEntityDescriptor,
} from "./lib/content-management/registry";
import { buildLocalizedFieldPatch } from "./lib/content-management/localized-field";
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

export function registerResources(mcp: McpServer) {
  mcp.registerResource(
    "content-management-entities",
    "sps://content/entities",
    {
      title: "SPS content-management entities",
      description:
        "Discover model and relation entities supported by the MCP content-management tools.",
    },
    async (uri) => {
      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(
              okEnvelope("content-entity-list", listContentEntities()),
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
    "content-entity-list",
    {
      title: "List SPS content entities",
      description:
        "List model and relation entities supported by generic content-management MCP tools.",
      inputSchema: {},
    },
    async () => {
      try {
        return okResponse("content-entity-list", describeContentEntities());
      } catch (error) {
        return unknownErrorResponse(error);
      }
    },
  );

  mcp.registerTool(
    "content-entity-describe",
    {
      title: "Describe SPS content entity",
      description:
        "Return route, fields, localized fields, variants, relations, and operations for one content entity.",
      inputSchema: ContentEntityDescribeInputSchema.shape,
    },
    async (args) => {
      try {
        return okResponse(
          "content-entity-describe",
          describeContentEntity(args),
        );
      } catch (error) {
        return unknownErrorResponse(error);
      }
    },
  );

  mcp.registerTool(
    "content-record-find",
    {
      title: "Find SPS content records",
      description:
        "Find model or relation records with filters, order, limit, and offset through the existing SDK/API path.",
      inputSchema: ContentFindInputSchema.shape,
    },
    async (args, extra) => {
      try {
        const authHeaders = getMcpAuthHeaders(extra, args);

        return okResponse(
          "content-record-find",
          await findContentRecords(args, { authHeaders }),
        );
      } catch (error) {
        return unknownErrorResponse(error);
      }
    },
  );

  mcp.registerTool(
    "content-record-count",
    {
      title: "Count SPS content records",
      description: "Count model or relation records with optional filters.",
      inputSchema: ContentCountInputSchema.shape,
    },
    async (args, extra) => {
      try {
        const authHeaders = getMcpAuthHeaders(extra, args);

        return okResponse(
          "content-record-count",
          await countContentRecords(args, { authHeaders }),
        );
      } catch (error) {
        return unknownErrorResponse(error);
      }
    },
  );

  mcp.registerTool(
    "content-record-get-by-id",
    {
      title: "Get SPS content record by id",
      description: "Get one content entity record by id.",
      inputSchema: ContentGetByIdInputSchema.shape,
    },
    async (args, extra) => {
      try {
        const authHeaders = getMcpAuthHeaders(extra, args);

        return okResponse(
          "content-record-get-by-id",
          await getContentRecordById(args, { authHeaders }),
        );
      } catch (error) {
        return unknownErrorResponse(error);
      }
    },
  );

  mcp.registerTool(
    "content-record-create",
    {
      title: "Create SPS content record",
      description:
        "Create a model or relation record through the existing SDK/API path. Use dryRun for payload validation without writing.",
      inputSchema: ContentCreateInputSchema.shape,
    },
    async (args, extra) => {
      try {
        const authHeaders = getMcpAuthHeaders(extra, args);

        return okResponse(
          "content-record-create",
          await createContentRecord(args, { authHeaders }),
        );
      } catch (error) {
        return unknownErrorResponse(error);
      }
    },
  );

  mcp.registerTool(
    "content-record-update",
    {
      title: "Update SPS content record",
      description:
        "Update a model or relation record through the existing SDK/API path. Use dryRun for payload validation without writing.",
      inputSchema: ContentUpdateInputSchema.shape,
    },
    async (args, extra) => {
      try {
        const authHeaders = getMcpAuthHeaders(extra, args);

        return okResponse(
          "content-record-update",
          await updateContentRecord(args, { authHeaders }),
        );
      } catch (error) {
        return unknownErrorResponse(error);
      }
    },
  );

  mcp.registerTool(
    "content-record-delete-preview",
    {
      title: "Preview SPS content record delete",
      description:
        "Read a record and return the confirmation token required by content-record-delete-apply.",
      inputSchema: ContentDeletePreviewInputSchema.shape,
    },
    async (args, extra) => {
      try {
        const authHeaders = getMcpAuthHeaders(extra, args);

        return okResponse(
          "content-record-delete-preview",
          await previewDeleteContentRecord(args, { authHeaders }),
        );
      } catch (error) {
        return unknownErrorResponse(error);
      }
    },
  );

  mcp.registerTool(
    "content-record-delete-apply",
    {
      title: "Apply SPS content record delete",
      description:
        "Delete a record only after content-record-delete-preview returned a matching confirmation token.",
      inputSchema: ContentDeleteApplyInputSchema.shape,
    },
    async (args, extra) => {
      try {
        const authHeaders = getMcpAuthHeaders(extra, args);

        return okResponse(
          "content-record-delete-apply",
          await applyDeleteContentRecord(args, { authHeaders }),
        );
      } catch (error) {
        return unknownErrorResponse(error);
      }
    },
  );

  mcp.registerTool(
    "content-host-graph-preview",
    {
      title: "Preview host content graph",
      description:
        "Resolve a host page URL into page widgets, host widgets, external widget relations, and supported external widget candidates.",
      inputSchema: HostGraphPreviewInputSchema.shape,
    },
    async (args, extra) => {
      try {
        const authHeaders = getMcpAuthHeaders(extra, args);

        return okResponse(
          "content-host-graph-preview",
          await resolveHostGraph(args, { authHeaders }),
        );
      } catch (error) {
        return unknownErrorResponse(error);
      }
    },
  );

  mcp.registerTool(
    "content-localized-field-update",
    {
      title: "Update localized content field",
      description:
        "Merge and update one locale key in a localized JSON field while preserving sibling locales.",
      inputSchema: LocalizedFieldUpdateInputSchema.shape,
    },
    async (args, extra) => {
      try {
        const authHeaders = getMcpAuthHeaders(extra, args);

        return okResponse(
          "content-localized-field-update",
          await updateLocalizedContentField(args, { authHeaders }),
        );
      } catch (error) {
        return unknownErrorResponse(error);
      }
    },
  );

  mcp.registerTool(
    "content-host-graph-localized-field-update",
    {
      title: "Update localized field through host graph",
      description:
        "Resolve a host URL and unambiguous external widget candidate, then dry-run or apply a locale-safe field update.",
      inputSchema: HostGraphLocalizedFieldUpdateInputSchema.shape,
    },
    async (args, extra) => {
      try {
        const parsed = HostGraphLocalizedFieldUpdateInputSchema.safeParse(args);

        if (!parsed.success) {
          return errorResponse("validation", parsed.error.message);
        }

        const authHeaders = getMcpAuthHeaders(extra, parsed.data);
        const graph = await resolveHostGraph(parsed.data, { authHeaders });
        const candidate = requireSingleHostGraphCandidate({
          result: graph,
          input: parsed.data,
        });

        if (!candidate.externalEntityKey || !candidate.externalWidget?.id) {
          return errorResponse(
            "validation",
            "Resolved host graph candidate does not include a supported external widget",
            { candidate },
          );
        }

        const descriptor = requireContentEntityDescriptor(
          candidate.externalEntityKey,
          contentEntityRegistry,
        );
        const data = buildLocalizedFieldPatch({
          descriptor,
          current: candidate.externalWidget,
          field: parsed.data.field,
          locale: parsed.data.locale,
          value: parsed.data.value,
        });

        if (parsed.data.dryRun) {
          return okResponse("content-host-graph-localized-field-update", {
            operation: "host-graph-localized-field-update",
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

        return okResponse("content-host-graph-localized-field-update", {
          operation: "host-graph-localized-field-update",
          dryRun: false,
          graph,
          candidate,
          before: candidate.externalWidget[parsed.data.field],
          after: updated?.[parsed.data.field],
          data: updated,
        });
      } catch (error) {
        return unknownErrorResponse(error);
      }
    },
  );
}

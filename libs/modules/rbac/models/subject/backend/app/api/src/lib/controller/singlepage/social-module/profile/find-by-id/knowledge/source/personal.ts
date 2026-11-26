import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { Service as KnowledgeService } from "@sps/knowledge/backend/app/api/src/lib/service";
import type { Service } from "../../../../../../../service";
import { Service as PersonalSources } from "../../../../../../../service/singlepage/social-module/profile/knowledge/personal";
import { z } from "zod";
import {
  findProfileKnowledgeSourceRelations,
  getKnowledgeSourceIds,
  requireParam,
} from "./helpers";

export class Handler {
  constructor(private readonly service: Service) {}

  async execute(c: Context): Promise<Response> {
    try {
      const profileId = requireParam(c, "socialModuleProfileId");
      const actorId = requireParam(c, "id");
      const personal = new PersonalSources(this.service);
      if (c.req.method === "POST" || c.req.method === "PATCH") {
        const note = z.object({
          title: z.string().trim().min(1),
          content: z.string().refine((value) => Boolean(value.trim())),
        });
        const body = (await c.req.json().catch(() => null))?.data;
        let saved;
        if (c.req.method === "POST") {
          const input = note
            .extend({
              operationKey: z.uuid(),
              orderIndex: z.number().int().nonnegative().optional(),
            })
            .strict()
            .safeParse(body);
          if (!input.success) {
            throw new Error("Validation error. Invalid personal note");
          }
          saved = await personal.create(actorId, profileId, input.data);
        } else {
          const input = note
            .extend({
              expectedContentHash: z.string().regex(/^[a-f0-9]{64}$/),
              expectedTitle: z.string(),
            })
            .strict()
            .safeParse(body);
          if (!input.success) {
            throw new Error("Validation error. Invalid personal note revision");
          }
          saved = await personal.update(
            actorId,
            profileId,
            requireParam(c, "knowledgeModuleSourceId"),
            input.data,
          );
        }
        return c.json({
          data: { ...saved.source, editable: true },
        });
      }
      const relations = await findProfileKnowledgeSourceRelations({
        service: this.service,
        socialModuleProfileId: profileId,
        includeCustomerMemory: true,
      });
      const memories = new Set(
        relations
          .filter((link) => link.variant === "customer-memory")
          .map((link) => link.knowledgeModuleSourceId),
      );
      const documents = await new KnowledgeService().listSources({
        sourceIds: getKnowledgeSourceIds(relations),
      });
      const data = documents.filter(
        (source) =>
          (source.variant === "customer-memory") === memories.has(source.id),
      );
      const writable = await personal.editable(profileId, data);
      return c.json({
        data: data.map((source) => ({
          ...source,
          editable: writable.has(source.id),
        })),
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}

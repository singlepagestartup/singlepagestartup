import "reflect-metadata";
import { isDeepStrictEqual } from "node:util";
import slugify from "slugify";
import { v5 as uuidFromKey } from "uuid";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { createModules } from "@sps/crm/backend/app/api/src/lib/modules";
import { Table } from "@sps/crm/models/funnel/backend/repository/database";
import {
  employeeTrainingStageFunding,
  funnelDefinitionSchema,
  funnelEditCommandSchema,
  getFunnelBySlugSchema,
  listFunnelsSchema,
  linearFunnelDefinition,
  resolveFunnelSchema,
  saveFunnelSchema,
  updatedPage,
  type IFunnelBindings,
  type IFunnelDefinition,
  type IFunnelStage,
  type TFunnelEditCommand,
  type IGetFunnelBySlug,
  type IListFunnels,
  type IModel as IFunnel,
  type IResolveFunnel,
  type ISaveFunnel,
} from "@sps/crm/models/funnel/sdk/model";
import { createModule } from "../module";
import type { Repository } from "../../repository";
import {
  enterStage,
  nextTimer,
} from "@sps/crm/models/task/backend/app/api/src/lib/service/singlepage/utils";
import { validateFunnelDefinition } from "./utils";

type TStoredFunnel = NonNullable<Awaited<ReturnType<Repository["scoped"]>>>;

interface ISelection {
  storeId: string;
  productId?: string;
  offerId?: string;
  formId?: string;
}

interface IStageRemoval {
  onMigrated?: (taskId: string, stage: IFunnelStage) => Promise<void>;
  stageId: string;
  targetStageId?: string;
  actorId: string;
}

@injectable()
@injectFromBase()
export class Service extends CRUDService<typeof Table.$inferSelect> {
  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  private owner() {
    return this.repository as Repository;
  }

  override async find(
    props?: Parameters<CRUDService<typeof Table.$inferSelect>["find"]>[0],
  ) {
    const rows = await super.find(props);
    return this.owner().configurations(rows);
  }

  override async findById(input: { id: string }) {
    const row = await super.findById(input);
    const [funnel] = await this.owner().configurations(row ? [row] : []);
    return funnel ?? null;
  }

  async lock(storeId: string, funnelId: string, mode: "share" | "update") {
    const locked = await this.owner().lock(storeId, funnelId, mode);
    if (!locked) {
      throw new Error("Not Found error. Funnel does not exist in this store");
    }
  }

  private runtime(stored: TStoredFunnel) {
    const parsed = funnelDefinitionSchema.safeParse(stored.definition);
    if (!parsed.success) {
      return undefined;
    }
    try {
      validateFunnelDefinition(parsed.data, stored.kind);
    } catch {
      return undefined;
    }
    return { ...stored, definition: parsed.data, funnelId: stored.id };
  }

  async editLinkedStage<T>(
    stageId: string,
    edit: (linked: boolean) => Promise<T>,
  ) {
    const ids = await this.owner().funnelIds(stageId);
    return this.editStages(ids, () => edit(ids.length > 0));
  }

  async editStages<T>(funnelIds: string[], edit: () => Promise<T>): Promise<T> {
    const owner = this.owner();
    return owner.transaction(async () => {
      const configurations: IFunnel[] = [];
      for (const id of [...new Set(funnelIds)].sort()) {
        const row = await owner.lockById(id);
        if (!row) {
          throw new Error("Not Found error. Funnel does not exist");
        }
        configurations.push(await this.get(row.storeId, id));
      }
      const result = await edit();
      for (const before of configurations) {
        const after = await this.get(before.storeId, before.id);
        await owner.rebindOpenStageStates(before.id);
        if (
          isDeepStrictEqual(before.definition.stages, after.definition.stages)
        ) {
          continue;
        }
        validateFunnelDefinition(
          funnelDefinitionSchema.parse(after.definition),
          after.kind,
        );
        const now = new Date();
        await this.reconcileTasks(before, after.definition, now);
        await owner.bumpRevision(before.id, now);
      }
      return result;
    });
  }

  storeTaskCount(storeId: string) {
    return this.owner().storeTaskCount(storeId);
  }

  taskScopes(criteria: {
    primaryOnly?: boolean;
    taskIds?: string[];
    storeId?: string;
    funnelId?: string;
  }) {
    return this.owner().taskScopes(criteria);
  }

  async linkTask(funnelId: string, taskId: string) {
    const { entity } = await this.module.funnelsToTasks.findOrCreate({
      data: { funnelId, taskId },
    });
    return entity;
  }

  async replaceTaskPrimaryFunnel(input: {
    taskId: string;
    fromId: string;
    toId: string;
    revision: number;
    assignmentRevision: number;
  }) {
    const { taskId, fromId, toId, revision, assignmentRevision } = input;
    const owner = this.owner();
    await owner.replacePrimaryFunnel(taskId, fromId, toId);
    await owner.rebindOpenStageStates(toId, taskId);
    await owner.reviseTask(taskId, {
      revision,
      assignmentRevision,
      updatedAt: new Date(),
    });
  }

  async get(
    storeId: string,
    funnelId: string,
    _includeLegacyProductBindings = false,
  ) {
    const stored = await this.owner().scoped(storeId, funnelId);
    if (!stored) {
      throw new Error("Not Found error. Funnel does not exist in this store");
    }
    return stored;
  }

  async getBySlug(
    input: IGetFunnelBySlug,
    _includeLegacyProductBindings = false,
  ) {
    const { storeId, funnelSlug } = getFunnelBySlugSchema.parse(input);
    const stored = await this.owner().scopedBySlug(storeId, funnelSlug);
    if (!stored) {
      throw new Error("Not Found error. Funnel does not exist in this store");
    }
    return stored;
  }

  async current(storeId: string, funnelId: string) {
    const stored = await this.owner().scoped(storeId, funnelId);
    if (!stored) {
      throw new Error("Not Found error. Funnel does not exist in this store");
    }
    const funnel = await this.runtime(stored);
    if (!funnel) {
      throw new Error(
        "Conflict error. Save a valid configuration before using the funnel",
      );
    }
    return funnel;
  }

  async list(input: IListFunnels) {
    const data = listFunnelsSchema.parse(input);
    const { items, total } = await this.owner().list(data);
    const limit = data.limit ?? 50;
    const page = updatedPage(items, limit);
    const nextOffset = (data.offset ?? 0) + page.items.length;
    return {
      ...page,
      total,
      nextOffset: !data.cursor && nextOffset < total ? nextOffset : undefined,
    };
  }

  linkedToProduct(input: {
    storeId: string;
    productId: string;
    offerIds: string[];
  }) {
    return this.owner().linkedToProduct(input);
  }

  async trainingBudget(storeId: string, ownerId: string) {
    const candidates = await this.owner().trainingBudget(storeId);
    for (const candidate of candidates) {
      const definition = candidate.definition;
      if (
        definition &&
        (definition.workFunding?.payer === "store-owner" ||
          employeeTrainingStageFunding(definition, ownerId)) &&
        !definition.maintenanceSourceId
      ) {
        return this.runtime(candidate);
      }
    }
    return undefined;
  }

  assertApplicable(bindings: IFunnelBindings, input: ISelection) {
    if (
      (bindings.storeWide === false ||
        bindings.formIds.length ||
        bindings.offerIds.length) &&
      !(input.formId && bindings.formIds.includes(input.formId)) &&
      !(input.offerId && bindings.offerIds.includes(input.offerId))
    ) {
      throw new Error(
        "Conflict error. The funnel does not apply to this request",
      );
    }
  }

  async resolveSelection(input: ISelection) {
    const catalog = this.modules.ecommerce.storesToProducts;
    if (input.offerId) {
      const offer = await catalog.findById({ id: input.offerId });
      if (
        !offer ||
        offer.storeId !== input.storeId ||
        (input.productId && offer.productId !== input.productId)
      ) {
        throw new Error(
          "Not Found error. Offer does not match the store and product",
        );
      }
      return { offerId: offer.id, productId: offer.productId };
    }

    if (input.productId) {
      const offers = await catalog.find({
        params: {
          limit: 2,
          filters: {
            and: [
              { column: "storeId", method: "eq", value: input.storeId },
              { column: "productId", method: "eq", value: input.productId },
            ],
          },
        },
      });
      if (offers.length > 1) {
        throw new Error("Conflict error. Select an offer for this product");
      }
      const [offer] = offers;
      if (!offer) {
        throw new Error(
          "Not Found error. Product is unavailable in this store",
        );
      }
      return { offerId: offer.id, productId: input.productId };
    }

    return { offerId: undefined, productId: undefined };
  }

  async selectProducts(
    storeId: string,
    current: IFunnelBindings | undefined,
    selected: string[],
  ) {
    const productIds = [...new Set(selected)];
    const offerIds = current?.offerIds ?? [];
    const linked = offerIds.length
      ? await this.modules.ecommerce.storesToProducts.find({
          params: {
            filters: {
              and: [
                { column: "storeId", method: "eq", value: storeId },
                { column: "id", method: "inArray", value: offerIds },
              ],
            },
          },
        })
      : [];
    const offers = new Map(linked.map(({ id, productId }) => [id, productId]));
    const offerProductIds = new Set(offers.values());
    const selectedProducts = new Set(productIds);
    const directLinks = new Set(current?.productIds);
    return {
      productIds: productIds.filter(
        (id) => directLinks.has(id) || !offerProductIds.has(id),
      ),
      offerIds: offerIds.filter((id) => {
        const productId = offers.get(id);
        return productId !== undefined && selectedProducts.has(productId);
      }),
      formIds: current?.formIds ?? [],
    };
  }

  private async validateBindings(storeId: string, bindings: IFunnelBindings) {
    for (const productId of new Set(bindings.productIds)) {
      await this.resolveSelection({ storeId, productId });
    }
    for (const offerId of new Set(bindings.offerIds)) {
      await this.resolveSelection({ storeId, offerId });
    }
    for (const id of new Set(bindings.formIds)) {
      const form = await this.module.form.findById({ id });
      if (!form) {
        throw new Error("Not Found error. Funnel form does not exist");
      }
    }
  }

  private async validateConfiguration(
    data: ReturnType<typeof saveFunnelSchema.parse>,
    validateStageAssignments?: (definition: IFunnelDefinition) => Promise<void>,
  ) {
    validateFunnelDefinition(data.definition, data.kind);
    if (validateStageAssignments) {
      await validateStageAssignments(data.definition);
    }
    await this.validateBindings(data.storeId, data.bindings);
    const cartOfferIds = new Set(
      data.definition.stages.flatMap((stage) => stage.cartOfferIds ?? []),
    );
    for (const offerId of cartOfferIds) {
      await this.resolveSelection({ storeId: data.storeId, offerId });
    }
  }

  private async reconcileTasks(
    current: IFunnel,
    definition: IFunnelDefinition,
    now: Date,
    removal?: IStageRemoval,
  ) {
    const owner = this.owner();
    const previousStages = new Map(
      current.definition.stages.map((stage) => [stage.id, stage]),
    );
    const stages = new Map(
      definition.stages
        .filter((stage) => !stage.archived)
        .map((stage) => [stage.id, stage]),
    );
    const occupied = await owner.occupiedStages(current.id);
    for (const { stageId } of occupied) {
      if (
        !stages.has(stageId) &&
        !(removal?.stageId === stageId && removal.targetStageId)
      ) {
        const name = previousStages.get(stageId)?.name ?? stageId;
        throw new Error(
          `Conflict error. Move or close open tasks in "${name}" before removing the stage`,
        );
      }
    }

    const sharedWorkChanged =
      current.definition.progression !== definition.progression ||
      !isDeepStrictEqual(
        current.definition.workFunding,
        definition.workFunding,
      ) ||
      current.definition.maintenanceSourceId !== definition.maintenanceSourceId;
    const changedStages = new Set(
      [...stages.values()]
        .filter((stage) => {
          const previous = previousStages.get(stage.id);
          // A stage's display name has no effect on assignments or timers.
          return !isDeepStrictEqual(stage, { ...previous, name: stage.name });
        })
        .map((stage) => stage.id),
    );
    const activeKeys = [...stages.keys()];
    const added = activeKeys.filter(
      (key) => !previousStages.has(key) || previousStages.get(key)?.archived,
    );
    const previousKeys = [...previousStages.values()]
      .filter((stage) => !stage.archived && stages.has(stage.id))
      .map((stage) => stage.id);
    const reordered =
      definition.progression === "linear" &&
      !isDeepStrictEqual(
        previousKeys,
        activeKeys.filter((key) => !added.includes(key)),
      );
    const affected = occupied.filter(
      ({ stageId }) =>
        stageId === removal?.stageId ||
        added.length > 0 ||
        reordered ||
        sharedWorkChanged ||
        changedStages.has(stageId),
    );
    if (!affected.length) {
      return;
    }

    const tasks = await owner.stagesForTaskReconciliation(
      current.id,
      affected.map(({ stageId }) => stageId),
    );
    for (const { task } of tasks) {
      if (removal?.stageId === task.stageId && removal.targetStageId) {
        const progress = this.module.tasksToStages;
        if (added.length) {
          await progress.addStages(task, current.id, added, new Set(added));
        }
        const target = stages.get(removal.targetStageId)!;
        const revision = task.revision + 1;
        const assignmentRevision = task.assignmentRevision + 1;
        const moved = { ...task, revision, assignmentRevision };
        await progress.setStageState(moved, task.stageId, "closed");
        await progress.setStageState(moved, target.id, "current");
        const patch = enterStage(
          task.id,
          target,
          revision,
          assignmentRevision,
          now,
        );
        await owner.reviseTask(task.id, {
          ...patch,
          revision,
          assignmentRevision,
          updatedAt: now,
        });
        const stage = await progress.stageForTask(task.id, target.id);
        const operationKey = `funnel-stage-removal:${current.id}:${current.revision}`;
        await progress.append({
          taskId: task.id,
          stageId: stage.id,
          status: patch.status,
          revision,
          assignmentRevision,
          actorId: removal.actorId,
          actorKind: "manager",
          kind: "migrated",
          operationKey,
          operationDigest: operationKey,
          detail: { previousStageId: task.stageId, stageId: target.id },
        });
        await removal.onMigrated?.(task.id, target);
        continue;
      }
      if (added.length || reordered) {
        const progress = this.module.tasksToStages;
        if (added.length) {
          await progress.addStages(task, current.id, added, new Set(added));
        }
        const states = await progress.stageStates(task.id);
        for (const key of added) {
          if (states[key] === "pending") {
            await progress.setStageState(task, key, "required");
          }
        }
        const earlier = activeKeys.slice(0, activeKeys.indexOf(task.stageId));
        const prerequisite = earlier.find((key) => {
          if (states[key] === "completed") {
            return false;
          }
          return added.includes(key) || reordered;
        });
        if (prerequisite) {
          const assignmentRevision = task.assignmentRevision + 1;
          const revision = task.revision + 1;
          const updated = { ...task, revision, assignmentRevision };
          await progress.setStageState(updated, task.stageId, "required");
          await progress.setStageState(updated, prerequisite, "current");
          await owner.reviseTask(task.id, {
            ...enterStage(
              task.id,
              stages.get(prerequisite)!,
              revision,
              assignmentRevision,
              now,
            ),
            assignmentRevision,
            revision,
            updatedAt: now,
          });
          continue;
        }
      }
      const stage = stages.get(task.stageId)!;
      const previous = previousStages.get(task.stageId);
      const workChanged = sharedWorkChanged;
      const executionChanged =
        workChanged ||
        !isDeepStrictEqual(stage, { ...previous, name: stage.name });
      const assignmentRevision =
        task.assigneeKind && executionChanged
          ? task.assignmentRevision + 1
          : task.assignmentRevision;
      const waitingChanged = !isDeepStrictEqual(
        previous?.waiting,
        stage.waiting,
      );
      if (
        !added.length &&
        assignmentRevision === task.assignmentRevision &&
        !waitingChanged
      ) {
        continue;
      }

      const revision = task.revision + 1;
      let waiting:
        | ReturnType<typeof enterStage>
        | ReturnType<typeof nextTimer>
        | undefined;
      if (
        stage.waiting &&
        task.waitingSince &&
        task.waitingRevision &&
        task.expectedEvent === stage.waiting.expectedEvent
      ) {
        const remindersSent =
          task.timer?.kind === "reminder"
            ? task.timer.number - 1
            : (previous?.waiting?.reminderSeconds.length ?? 0);
        waiting = nextTimer(
          task.id,
          stage,
          task.waitingSince,
          task.waitingRevision,
          assignmentRevision,
          remindersSent,
          now,
        );
      } else if (waitingChanged) {
        waiting = enterStage(task.id, stage, revision, assignmentRevision, now);
      }
      await owner.reviseTask(task.id, {
        ...waiting,
        revision,
        assignmentRevision,
        updatedAt: now,
      });
    }
  }

  async save(
    input: ISaveFunnel,
    validateStageAssignments?: (definition: IFunnelDefinition) => Promise<void>,
  ) {
    return this.persist(input, validateStageAssignments);
  }

  async edit(
    input: TFunnelEditCommand,
    actorId: string,
    options: {
      onMigrated?: IStageRemoval["onMigrated"];
      validateStage?: (
        definition: IFunnelDefinition,
        previous: IFunnel,
      ) => Promise<void>;
    } = {},
  ) {
    const edit = funnelEditCommandSchema.parse(input);
    const { storeId, funnelId, expectedRevision } = edit.funnel;
    const owner = this.owner();
    return owner.transaction(async () => {
      await this.lock(storeId, funnelId, "update");
      const previous = await this.get(storeId, funnelId);
      if (previous.revision !== expectedRevision) {
        throw new Error("Conflict error. Reload the funnel before saving");
      }
      let bindings: Partial<IFunnelBindings> = {
        offerIds: previous.bindings.offerIds,
        formIds: previous.bindings.formIds,
      };
      let name = previous.name;
      let definition = previous.definition;
      let removal: IStageRemoval | undefined;
      if (edit.kind === "save-funnel-settings") {
        const settings = edit.funnel;
        name = settings.name;
        if (settings.linkedProductIds !== undefined) {
          bindings = await this.selectProducts(
            storeId,
            previous.bindings,
            settings.linkedProductIds,
          );
        }
        definition = {
          ...definition,
          applicability: settings.applicability ?? definition.applicability,
          goal: settings.goal ?? definition.goal,
        };
        if (settings.maintenanceSourceId !== undefined) {
          definition.maintenanceSourceId =
            settings.maintenanceSourceId ?? undefined;
        }
      } else {
        definition = linearFunnelDefinition(previous.definition);
        const stages = [...definition.stages];
        if (edit.kind === "save-funnel-stage") {
          const stage = edit.funnel.stage;
          const index = stages.findIndex(({ id }) => id === stage.id);
          if (index < 0) {
            stages.push(stage);
          } else {
            stages[index] = stage;
          }
        } else {
          const { stageId, targetStageId } = edit.funnel;
          const from = stages.findIndex(({ id }) => id === stageId);
          const to = stages.findIndex(({ id }) => id === targetStageId);
          if (from < 0 || (targetStageId !== undefined && to < 0)) {
            throw new Error(
              "Not Found error. The stage does not belong to this funnel",
            );
          }
          if (from === to) {
            throw new Error("Validation error. Select a different stage");
          }
          const [stage] = stages.splice(from, 1);
          if (edit.kind === "move-funnel-stage") {
            stages.splice(to, 0, stage);
          } else {
            if (
              targetStageId &&
              !stages.some(
                (entry) => entry.id === targetStageId && !entry.archived,
              )
            ) {
              throw new Error(
                "Validation error. Choose an active destination stage",
              );
            }
            if (!stages.some((entry) => !entry.archived)) {
              throw new Error(
                "Validation error. The funnel requires an active stage",
              );
            }
            removal = {
              stageId,
              targetStageId,
              actorId,
              onMigrated: options.onMigrated,
            };
          }
        }
        definition = linearFunnelDefinition({ ...definition, stages });
      }
      const validate = options.validateStage;
      return this.persist(
        {
          storeId,
          funnelId,
          expectedRevision,
          kind: previous.kind,
          name,
          definition,
          bindings,
        },
        validate ? (next) => validate(next, previous) : undefined,
        removal,
      );
    });
  }

  private async persist(
    input: ISaveFunnel,
    validateStageAssignments?: (definition: IFunnelDefinition) => Promise<void>,
    removal?: IStageRemoval,
  ) {
    const data = saveFunnelSchema.parse(input);
    if (data.definition.progression === "linear") {
      data.definition = linearFunnelDefinition(data.definition);
    }
    const owner = this.owner();
    return owner.transaction(async () => {
      const offerIds = new Set(data.bindings.offerIds);
      for (const productId of data.bindings.productIds) {
        const offers = await this.modules.ecommerce.storesToProducts.find({
          params: {
            filters: {
              and: [
                { column: "storeId", method: "eq", value: data.storeId },
                { column: "productId", method: "eq", value: productId },
              ],
            },
          },
        });
        if (!offers.length) {
          throw new Error(
            "Not Found error. Product is unavailable in this store",
          );
        }
        if (offers.some((offer) => offerIds.has(offer.id))) {
          continue;
        }
        for (const offer of offers) {
          offerIds.add(offer.id);
        }
      }
      data.bindings = {
        formIds: data.bindings.formIds,
        productIds: [],
        offerIds: [...offerIds].sort(),
      };
      const configuration = {
        name: data.name,
        kind: data.kind,
        // Match JSONB's treatment of optional fields on internal service retries.
        definition: funnelDefinitionSchema.parse(
          JSON.parse(JSON.stringify(data.definition)),
        ),
        bindings: data.bindings,
      };
      const { stages, ...metadata } = configuration.definition;
      const formBindings = {
        formIds: configuration.bindings.formIds,
        storeWide:
          !configuration.bindings.formIds.length &&
          !configuration.bindings.offerIds.length,
      };
      const now = new Date();

      if (!data.funnelId) {
        if (data.expectedRevision !== undefined) {
          throw new Error("Validation error. A new funnel has no revision");
        }

        let id: string | undefined;
        if (data.operationKey) {
          id = uuidFromKey(data.operationKey, data.storeId);
          await owner.lockCreation(id);
          const existing = await owner.scoped(data.storeId, id);
          if (existing) {
            const current = existing;
            if (!this.matches(current, configuration)) {
              throw new Error(
                "Conflict error. The creation key already belongs to another funnel configuration",
              );
            }
            return current;
          }
        }

        const store = await this.modules.ecommerce.store.findById({
          id: data.storeId,
        });
        if (!store) {
          throw new Error("Not Found error. Store does not exist");
        }

        await this.validateConfiguration(data, validateStageAssignments);
        const slugBase = slugify(data.name, {
          lower: true,
          strict: true,
          locale: "ru",
          trim: true,
        })
          .slice(0, 150)
          .replace(/-+$/, "");
        const slug = slugBase === "new" ? "new-funnel" : slugBase || "funnel";
        const row = await owner.createFunnel({
          ...configuration,
          definition: metadata,
          bindings: formBindings,
          id,
          storeId: data.storeId,
          slug,
        });
        await owner.replaceStageLinks(row.id, configuration.definition);
        await owner.replaceOfferLinks(row.id, configuration.bindings.offerIds);
        return this.get(row.storeId, row.id);
      }

      await this.lock(data.storeId, data.funnelId, "update");
      const stored = await owner.scoped(data.storeId, data.funnelId);
      if (!stored) {
        throw new Error("Not Found error. Funnel does not exist in this store");
      }
      const current = stored;
      if (current.kind !== data.kind) {
        throw new Error("Validation error. An existing funnel keeps its kind");
      }
      if (data.expectedRevision === undefined) {
        throw new Error(
          "Validation error. Saving a funnel requires its current revision",
        );
      }
      const matches = this.matches(current, configuration);
      if (matches) {
        return current;
      }
      if (current.revision !== data.expectedRevision) {
        throw new Error("Conflict error. Reload the funnel before saving");
      }

      await this.validateConfiguration(data, validateStageAssignments);

      const row = await owner.replaceConfiguration(current.id, {
        ...configuration,
        definition: metadata,
        bindings: formBindings,
        revision: current.revision + 1,
        updatedAt: now,
      });
      if (
        !isDeepStrictEqual(
          current.definition.stages,
          configuration.definition.stages,
        )
      ) {
        await owner.replaceStageLinks(row.id, configuration.definition);
        await owner.rebindOpenStageStates(row.id);
      }
      if (
        !isDeepStrictEqual(
          current.bindings.offerIds,
          configuration.bindings.offerIds,
        )
      ) {
        await owner.replaceOfferLinks(row.id, configuration.bindings.offerIds);
      }
      await this.reconcileTasks(
        current,
        configuration.definition,
        now,
        removal,
      );
      return this.get(row.storeId, row.id);
    });
  }

  private matches(
    funnel: IFunnel,
    configuration: Pick<IFunnel, "name" | "kind" | "definition" | "bindings">,
  ) {
    return (
      funnel.name === configuration.name &&
      funnel.kind === configuration.kind &&
      (funnel.bindings.storeWide ??
        (!funnel.bindings.offerIds.length &&
          !funnel.bindings.formIds.length)) ===
        (!configuration.bindings.offerIds.length &&
          !configuration.bindings.formIds.length) &&
      isDeepStrictEqual(funnel.definition, configuration.definition) &&
      isDeepStrictEqual(
        funnel.bindings.offerIds,
        configuration.bindings.offerIds,
      ) &&
      isDeepStrictEqual(funnel.bindings.formIds, configuration.bindings.formIds)
    );
  }

  async resolveFormIntake(formId: string) {
    const candidates = await this.owner().candidatesForForm(formId);
    const matches = candidates.filter((candidate) =>
      this.runtime(candidate)?.bindings.formIds.includes(formId),
    );
    if (matches.length > 1) {
      throw new Error(
        "Conflict error. Multiple stores or workflows accept this form",
      );
    }
    const match = matches[0];
    if (!match) {
      return undefined;
    }
    const funnel = await this.runtime(match);
    if (!funnel) {
      return undefined;
    }
    return { funnel, storeId: funnel.storeId };
  }

  async resolve(input: IResolveFunnel) {
    const data = resolveFunnelSchema.parse(input);
    const { offerId } = await this.resolveSelection(data);
    const candidates = await this.owner().candidates(data.storeId, data.kind);
    const bySpecificity = [[], [], []] as (typeof candidates)[];
    for (const candidate of candidates) {
      const configuration = this.runtime(candidate);
      if (!configuration || configuration.definition.maintenanceSourceId) {
        continue;
      }
      const { bindings } = configuration;
      if (data.formId && bindings.formIds.includes(data.formId)) {
        bySpecificity[0].push(candidate);
      } else if (offerId && bindings.offerIds.includes(offerId)) {
        bySpecificity[1].push(candidate);
      } else if (
        bindings.storeWide !== false &&
        bindings.formIds.length === 0 &&
        bindings.offerIds.length === 0
      ) {
        bySpecificity[2].push(candidate);
      }
    }

    const matches = bySpecificity.find((candidates) => candidates.length > 0);
    if (!matches) {
      return null;
    }
    if (matches.length > 1) {
      throw new Error("Conflict error. Multiple funnels match this selection");
    }
    const funnel = await this.runtime(matches[0]);
    return funnel ?? null;
  }

  override async create(): Promise<never> {
    throw new Error("Forbidden error. Use save to create a funnel");
  }

  override async findOrCreate(): Promise<never> {
    throw new Error("Forbidden error. Use save to create a funnel");
  }

  override async update(): Promise<never> {
    throw new Error("Forbidden error. Use funnel commands to change a funnel");
  }

  override async delete(): Promise<never> {
    throw new Error(
      "Forbidden error. Funnel records are retained for linked tasks",
    );
  }
}

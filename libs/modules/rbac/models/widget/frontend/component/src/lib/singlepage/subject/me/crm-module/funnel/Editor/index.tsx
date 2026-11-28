import { storeSectionHref } from "../../../ecommerce-module/store/paths";
import { Select } from "@sps/ui-adapter";
import { settingsFormStyles } from "@sps/shared-ui-shadcn";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  linearFunnelDefinition,
  customerStageFunding,
  stageWorkFundingSchema,
  type IFunnelDefinition,
  type IFunnelStage,
  type TFunnelKind,
} from "@sps/crm/models/funnel/sdk/model";
import { customerPaysForWork } from "@sps/crm/models/stage/sdk/model";
import type {
  ICrmWorkspaceFunnel,
  ICrmWorkspaceOptions,
  ICrmWorkspaceProduct,
  TCrmWorkspaceCommand,
  TCrmWorkspaceCommandResult,
} from "@sps/rbac/models/subject/sdk/model";
import {
  Field,
  TextField,
} from "../../../../../subject-me-crm-module-store-workspace/Fields";
import { hasStatus } from "../../../../../subject-me-crm-module-store-workspace/view-model";
import { FunnelError } from "../StoreScope";
import { StageEditor } from "./StageEditor";
import { RemoveStageDialog } from "./RemoveStageDialog";
import { StageList } from "./StageList";
import { FunnelProducts } from "./FunnelProducts";

const kinds: Record<TFunnelKind, string> = {
  consultation: "Консультация",
  "individual-service": "Индивидуальная услуга",
  "physical-order": "Физический заказ",
};

type TFunnelCommand = Extract<TCrmWorkspaceCommand, { funnel: unknown }>;
type TFeedback = {
  scope: "stage" | "settings";
  message: string;
  error?: boolean;
};

interface IEditorProps {
  subjectId: string;
  storeId: string;
  storeSlug: string;
  language: string;
  initial?: ICrmWorkspaceFunnel;
  options: ICrmWorkspaceOptions;
  execute: (
    command: TCrmWorkspaceCommand,
  ) => Promise<TCrmWorkspaceCommandResult>;
  onCreated?: (funnel: ICrmWorkspaceFunnel) => void;
  refresh?: () => Promise<unknown>;
}

function newStage(people: ICrmWorkspaceOptions["participants"]): IFunnelStage {
  return {
    id: crypto.randomUUID(),
    name: "Новый этап",
    defaultAssigneeSubjectId: people.length === 1 ? people[0].id : undefined,
    instruction: "",
    actions: [],
  };
}

function linkedProducts(funnel?: ICrmWorkspaceFunnel): ICrmWorkspaceProduct[] {
  return (
    funnel?.linkedProducts ??
    funnel?.bindings.productIds.map((id) => ({ id })) ??
    []
  );
}

export function Editor({
  subjectId,
  storeId,
  storeSlug,
  language,
  initial,
  options,
  execute,
  onCreated,
  refresh,
}: IEditorProps) {
  const [funnel, setFunnel] = useState(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [products, setProducts] = useState(() => linkedProducts(initial));
  const productIds = products.map(({ id }) => id);
  const [kind, setKind] = useState<TFunnelKind>(
    initial?.kind ?? "consultation",
  );
  const savedDefinition = useMemo(
    () => funnel && linearFunnelDefinition(funnel.definition),
    [funnel],
  );
  const savedStageIds = useMemo(
    () =>
      savedDefinition && new Set(savedDefinition.stages.map(({ id }) => id)),
    [savedDefinition],
  );
  const [drafts, setDrafts] = useState<IFunnelStage[]>(() =>
    initial ? [] : [newStage(options.participants)],
  );
  const [selectedId, setSelectedId] = useState(
    () => savedDefinition?.stages[0].id ?? drafts[0].id,
  );
  const [applicability, setApplicability] = useState(
    initial?.definition.applicability ?? "",
  );
  const [goal, setGoal] = useState(initial?.definition.goal ?? "");
  const [maintenanceSourceId, setMaintenanceSourceId] = useState(
    initial?.definition.maintenanceSourceId ?? "",
  );
  const stages = useMemo(() => {
    if (!savedDefinition) return drafts;
    const byId = new Map(drafts.map((stage) => [stage.id, stage]));
    return [
      ...savedDefinition.stages.map((stage) => byId.get(stage.id) ?? stage),
      ...drafts.filter((stage) => !savedStageIds?.has(stage.id)),
    ];
  }, [drafts, savedDefinition, savedStageIds]);
  const selected = stages.find((stage) => stage.id === selectedId) ?? stages[0];
  const [removing, setRemoving] = useState<IFunnelStage>();
  const [pending, setPending] = useState<TFunnelCommand["kind"]>();
  const [feedback, setFeedback] = useState<TFeedback>();
  const [saveDenied, setSaveDenied] = useState(false);
  const createOperationKey = useRef<string>(undefined);
  const busy = useRef(false);
  const newerFunnel =
    initial && funnel && initial.revision > funnel.revision
      ? initial
      : undefined;
  const locked = Boolean(pending || newerFunnel || saveDenied);
  const scope = useMemo(
    () =>
      funnel
        ? { storeId, funnelId: funnel.id, expectedRevision: funnel.revision }
        : undefined,
    [funnel, storeId],
  );
  function patchStage(patch: Partial<IFunnelStage>) {
    const updated = { ...selected, ...patch };
    setDrafts((current) =>
      current.some(({ id }) => id === updated.id)
        ? current.map((stage) => (stage.id === updated.id ? updated : stage))
        : [...current, updated],
    );
    setFeedback(undefined);
  }

  function addStage() {
    const stage = newStage(options.participants);
    setDrafts((current) => [...current, stage]);
    setSelectedId(stage.id);
    setFeedback(undefined);
  }

  function prepareStage(stage: IFunnelStage) {
    const original = savedDefinition?.stages.find(
      (item) => item.id === stage.id,
    );
    if (
      !stage.archived &&
      !stage.behavior &&
      !stage.defaultAssigneeSubjectId &&
      (!original || original.archived || original.defaultAssigneeSubjectId)
    ) {
      throw new Error("Выберите сотрудника для этапа.");
    }
    if (
      stage.archived ||
      (funnel ? savedDefinition?.maintenanceSourceId : maintenanceSourceId)
    )
      return stage;
    const {
      operations,
      payerSubjectId,
      imageBrief,
      imageBriefAutoGenerate,
      coverAttachmentRole,
      ...editable
    } = stage;
    if (editable.resultPricing?.kind !== "work-tokens") {
      delete editable.resultPricing;
    }
    const ai = options.participants.some(
      (person) =>
        person.id === stage.defaultAssigneeSubjectId && person.kind === "ai",
    );
    if (stage.behavior === "ecommerce-module-order-payment" && !ai) {
      return { ...editable, workFunding: undefined };
    }
    if (!ai && !stage.workFunding && !savedDefinition?.workFunding)
      return editable;
    const token = options.currencies.find(
      ({ slug }) => slug?.toLowerCase() === "token",
    );
    const workFunding = customerStageFunding(stage, token?.id ?? "");
    if (!stageWorkFundingSchema.safeParse(workFunding).success) {
      throw new Error("Проверьте валюту Token и коэффициент.");
    }
    if (
      editable.resultPricing?.kind === "work-tokens" &&
      !customerPaysForWork(workFunding)
    ) {
      throw new Error("Для этого этапа укажите коэффициент больше нуля.");
    }
    return {
      ...editable,
      ...(original?.workFunding?.payer === "customer" &&
        operations && { operations }),
      workFunding,
    };
  }

  const persist = useCallback(
    async (
      command: TFunnelCommand,
      location: TFeedback["scope"],
      message: string,
    ) => {
      if (busy.current || locked) return;
      busy.current = true;
      setPending(command.kind);
      setFeedback(undefined);
      try {
        const result = await execute(command);
        if (result.kind !== command.kind || !("definition" in result.data))
          throw new Error("Не удалось подтвердить сохранение.");
        setFunnel(result.data);
        setFeedback({ scope: location, message });
        return result.data;
      } catch (failure) {
        if (hasStatus(failure, 401, 403)) setSaveDenied(true);
        const conflict = hasStatus(failure, 409);
        let message =
          failure instanceof Error
            ? failure.message
            : "Не удалось сохранить изменения.";
        if (conflict && /reload|revision/i.test(message)) {
          message =
            "Воронка изменилась. Загрузите новую версию перед сохранением.";
        }
        setFeedback({
          scope: location,
          error: true,
          message,
        });
        if (conflict) await refresh?.();
        return undefined;
      } finally {
        busy.current = false;
        setPending(undefined);
      }
    },
    [execute, locked, refresh],
  );

  async function submitSettings() {
    if (!name.trim()) {
      setFeedback({
        scope: "settings",
        error: true,
        message: "Введите название воронки.",
      });
      return;
    }
    const settings = {
      name,
      applicability,
      goal,
      maintenanceSourceId: maintenanceSourceId.trim() || undefined,
      linkedProductIds: productIds,
    };
    let saved: ICrmWorkspaceFunnel | undefined;
    if (scope) {
      saved = await persist(
        {
          kind: "save-funnel-settings",
          funnel: {
            ...scope,
            ...settings,
            maintenanceSourceId: settings.maintenanceSourceId ?? null,
          },
        },
        "settings",
        "Настройки воронки сохранены.",
      );
    } else {
      const prepared: IFunnelStage[] = [];
      for (const stage of stages) {
        try {
          prepared.push(prepareStage(stage));
        } catch (error) {
          setSelectedId(stage.id);
          setFeedback({
            scope: "stage",
            error: true,
            message: (error as Error).message,
          });
          return;
        }
      }
      createOperationKey.current ??= crypto.randomUUID();
      const definition: IFunnelDefinition = linearFunnelDefinition({
        progression: "linear",
        applicability,
        goal,
        maintenanceSourceId: settings.maintenanceSourceId,
        initialStageId: prepared.find((stage) => !stage.archived)!.id,
        stages: prepared,
      });
      saved = await persist(
        {
          kind: "save",
          funnel: {
            storeId,
            kind,
            name,
            linkedProductIds: productIds,
            operationKey: createOperationKey.current,
            definition,
          },
        },
        "settings",
        "Воронка сохранена.",
      );
      if (saved) {
        setDrafts([]);
        setSelectedId(saved.definition.initialStageId);
        onCreated?.(saved);
      }
    }
    if (saved) {
      setName(saved.name);
      setApplicability(saved.definition.applicability ?? "");
      setGoal(saved.definition.goal ?? "");
      setMaintenanceSourceId(saved.definition.maintenanceSourceId ?? "");
      const linked = linkedProducts(saved);
      setProducts(linked);
    }
  }

  async function saveStage() {
    if (!scope) return;
    let stage: IFunnelStage;
    try {
      stage = prepareStage(selected);
    } catch (error) {
      setFeedback({
        scope: "stage",
        error: true,
        message: (error as Error).message,
      });
      return;
    }
    const saved = await persist(
      { kind: "save-funnel-stage", funnel: { ...scope, stage } },
      "stage",
      "Этап сохранён.",
    );
    if (saved)
      setDrafts((current) => current.filter((item) => item.id !== stage.id));
  }

  const moveStage = useCallback(
    async (id: string, targetId: string) => {
      if (id === targetId || locked) return;
      if (scope) {
        if (!savedStageIds?.has(id) || !savedStageIds.has(targetId)) return;
        await persist(
          {
            kind: "move-funnel-stage",
            funnel: { ...scope, stageId: id, targetStageId: targetId },
          },
          "stage",
          "Порядок этапов сохранён.",
        );
        return;
      }
      setDrafts((current) => {
        const next = [...current];
        const from = next.findIndex((s) => s.id === id);
        const to = next.findIndex((s) => s.id === targetId);
        if (from < 0 || to < 0) return current;
        next.splice(to, 0, ...next.splice(from, 1));
        return next;
      });
    },
    [locked, persist, savedStageIds, scope],
  );

  const selectStage = useCallback((id: string) => {
    setSelectedId(id);
    setFeedback((current) =>
      current?.scope === "stage" ? undefined : current,
    );
  }, []);

  const canRemove = (
    savedStageIds?.has(selected.id) ? savedDefinition!.stages : stages
  ).some((stage) => stage.id !== selected.id && !stage.archived);
  function requestRemoval() {
    if (locked || !canRemove) return;
    setFeedback(undefined);
    setRemoving(selected);
  }

  async function removeStage(targetStageId: string) {
    if (locked || !removing) return;
    if (!savedStageIds?.has(removing.id)) {
      setDrafts((current) =>
        current.filter((stage) => stage.id !== removing.id),
      );
      setSelectedId(targetStageId);
      setRemoving(undefined);
      return;
    }
    if (!scope) return;
    const saved = await persist(
      {
        kind: "delete-funnel-stage",
        funnel: { ...scope, stageId: removing.id, targetStageId },
      },
      "stage",
      "Этап удалён.",
    );
    if (saved) {
      setDrafts((current) =>
        current.filter((stage) => stage.id !== removing.id),
      );
      setSelectedId(targetStageId);
      setRemoving(undefined);
    }
  }

  function loadLatest(latest: ICrmWorkspaceFunnel) {
    setFunnel(latest);
    setDrafts([]);
    setName(latest.name);
    const linked = linkedProducts(latest);
    setProducts(linked);
    setKind(latest.kind);
    setApplicability(latest.definition.applicability ?? "");
    setGoal(latest.definition.goal ?? "");
    setMaintenanceSourceId(latest.definition.maintenanceSourceId ?? "");
    setSelectedId(latest.definition.stages[0].id);
    setFeedback(undefined);
    setRemoving(undefined);
  }

  function feedbackFor(location: TFeedback["scope"]) {
    if (!feedback || feedback.scope !== location) return null;
    return (
      <p
        role={feedback.error ? "alert" : "status"}
        className={
          feedback.error
            ? "text-sm text-destructive"
            : "text-sm text-muted-foreground"
        }
      >
        {feedback.message}
      </p>
    );
  }

  const employeesUrl = storeSectionHref(language, storeSlug, "employees");

  if (saveDenied) {
    return (
      <FunnelError
        language="ru"
        message="Нет доступа к редактированию этой воронки."
      />
    );
  }

  return (
    <section
      lang="ru"
      className="grid min-w-0 gap-4"
      aria-labelledby="crm-editor-title"
      aria-busy={Boolean(pending)}
    >
      <div className={`${settingsFormStyles.panel} grid gap-4`}>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1
              id="crm-editor-title"
              className="text-2xl font-semibold tracking-tight"
            >
              {initial ? "Редактор воронки" : "Новая воронка"}
            </h1>
          </div>
          <button
            type="button"
            className={settingsFormStyles.primary}
            disabled={locked}
            onClick={() => void submitSettings()}
          >
            {pending === "save" || pending === "save-funnel-settings"
              ? "Сохраняем…"
              : funnel
                ? "Сохранить настройки"
                : "Создать воронку"}
          </button>
        </header>
        {newerFunnel && !pending && (
          <div
            role="alert"
            className="grid gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"
          >
            <p>
              Воронка изменилась в другом сеансе. Загрузка новой версии сбросит
              несохранённые правки.
            </p>
            <button
              type="button"
              className={`${settingsFormStyles.secondary} w-fit`}
              onClick={() => loadLatest(newerFunnel)}
            >
              Загрузить новую версию
            </button>
          </div>
        )}
        {feedbackFor("settings")}
        <fieldset
          disabled={locked}
          className="grid min-w-0 gap-3 sm:grid-cols-2"
        >
          <TextField label="Название воронки" value={name} onChange={setName} />
          <Field label="Тип воронки">
            <Select
              ui="shadcn"
              className={settingsFormStyles.field}
              value={kind}
              disabled={Boolean(funnel?.id)}
              onValueChange={(selectedValue) =>
                setKind(selectedValue as TFunnelKind)
              }
              options={Object.entries(kinds).map(([id, title]) => ({
                value: id,
                label: title,
              }))}
            />
          </Field>
          <TextField
            label="Когда применять"
            value={applicability}
            multiline
            onChange={setApplicability}
          />
          <TextField
            label="Цель воронки"
            value={goal}
            multiline
            onChange={setGoal}
          />
          {kind === "consultation" &&
            (maintenanceSourceId ||
              savedDefinition?.maintenanceSourceId ||
              stages.some(
                (stage) =>
                  stage.workFunding && stage.workFunding.payer !== "customer",
              ) ||
              savedDefinition?.workFunding?.payer === "store-owner") && (
              <TextField
                label="ID источника для фоновой индексации"
                value={maintenanceSourceId}
                onChange={setMaintenanceSourceId}
              />
            )}
        </fieldset>
        <fieldset
          disabled={locked}
          className="grid gap-2 rounded-lg border border-border p-3"
        >
          <legend className="px-1 text-sm font-medium">Товары воронки</legend>
          <FunnelProducts
            subjectId={subjectId}
            storeId={storeId}
            storeSlug={storeSlug}
            language={language}
            selected={products}
            disabled={locked}
            onChange={setProducts}
          />
        </fieldset>
      </div>
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <StageList
          stages={stages}
          selectedId={selected.id}
          disabled={locked}
          savedStageIds={savedStageIds}
          onSelect={selectStage}
          onMove={moveStage}
          onAdd={addStage}
        />
        <section className={`${settingsFormStyles.panel} grid min-w-0 gap-4`}>
          <fieldset disabled={locked} className="grid min-w-0 gap-4">
            <StageEditor
              employeesUrl={employeesUrl}
              legacyFunding={savedDefinition?.workFunding}
              maintenance={Boolean(
                funnel
                  ? savedDefinition?.maintenanceSourceId
                  : maintenanceSourceId,
              )}
              kind={kind}
              language={language}
              key={selected.id}
              stage={selected}
              options={options}
              onChange={patchStage}
              canSave={!locked && !selected.archived}
              onSave={scope ? saveStage : undefined}
              canRemove={canRemove}
              onRemove={requestRemoval}
            />
          </fieldset>
          {!removing && feedbackFor("stage")}
        </section>
        {removing && (
          <RemoveStageDialog
            stage={removing}
            persisted={Boolean(savedStageIds?.has(removing.id))}
            stages={
              savedStageIds?.has(removing.id) ? savedDefinition!.stages : stages
            }
            pending={Boolean(pending)}
            disabled={locked}
            error={feedback?.error ? feedback.message : undefined}
            onClose={() => {
              setRemoving(undefined);
              setFeedback(undefined);
            }}
            onConfirm={removeStage}
          />
        )}
      </div>
    </section>
  );
}

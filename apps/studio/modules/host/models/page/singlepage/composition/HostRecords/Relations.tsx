import { useCallback, useMemo, useState } from "react";
import {
  HOST_STUDIO_EXTERNAL_MODULES,
  HOST_STUDIO_RELATIONS,
} from "../../../../../../../workspace/utils/host-studio/constants";
import {
  createHostLink,
  createHostModel,
  hostFieldValue,
  hostOwnerId,
  hostRecordLabel,
  hostTargetId,
  saveHostLink,
  sortHostLinks,
  unlinkHostRecords,
  validateHostLink,
  type HostLink,
  type HostRecord,
  type HostRelation,
} from "../../../../../../../workspace/utils/host-studio/index";
import {
  Records,
  RecordEditor,
  RecordForm,
  type IRecordField,
} from "../../../../../../../workspace/design/singlepage/interface-kit/Records";
import {
  Button,
  Icon,
  Select,
  kit,
} from "../../../../../../../workspace/design/singlepage/interface-kit/primitives";
import { useHostStudio } from "./Context";
import { HostModelPanel } from "./Model";
import { HostRecordPreview } from "./Preview";

export interface IHostRelationManagerProps {
  relation: HostRelation;
  ownerId?: string;
  embedded?: boolean;
}
interface IHostLinkFormProps {
  relation: HostRelation;
  link: HostLink;
  fixedOwner?: string;
  onSaved: () => void;
}
export function HostRelationManager({
  relation,
  ownerId,
  embedded,
}: IHostRelationManagerProps) {
  const { state, update } = useHostStudio();
  const config = HOST_STUDIO_RELATIONS[relation];
  const hasOwner = state.models[config.owner].some(
    (record) => !ownerId || record.id === ownerId,
  );
  const [draft, setDraft] = useState<HostLink | null>(null);
  const [preview, setPreview] = useState<HostRecord | null>(null);
  const edit = useCallback((link: HostLink) => setDraft(link), []);
  const remove = useCallback(
    (ids: string[]) =>
      update((current) => unlinkHostRecords(current, relation, ids)),
    [relation, update],
  );
  const showPreview = useCallback(
    (link: HostLink) => {
      if (config.target)
        setPreview(
          state.models[config.target].find(
            (item) => item.id === hostTargetId(relation, link),
          ) ?? null,
        );
    },
    [config.target, relation, state],
  );
  const create = useCallback(
    () =>
      setDraft(
        createHostLink(
          relation,
          ownerId ?? state.models[config.owner][0]?.id ?? "",
          config.target ? (state.models[config.target][0]?.id ?? "") : "",
          crypto.randomUUID(),
        ),
      ),
    [relation, ownerId, state, config],
  );
  const fields = useMemo<IRecordField<HostLink>[]>(
    () => [
      {
        key: config.ownerKey,
        label: config.owner,
        value: (link) => hostOwnerId(relation, link),
        displayValue: (link) => {
          const record = state.models[config.owner].find(
            (item) => item.id === hostOwnerId(relation, link),
          );
          return record ? hostRecordLabel(record) : "Missing owner";
        },
      },
      {
        key: config.targetKey,
        label: config.target ?? "External widget",
        value: (link) => hostTargetId(relation, link),
        displayValue: (link) => {
          const record =
            config.target &&
            state.models[config.target].find(
              (item) => item.id === hostTargetId(relation, link),
            );
          return record
            ? hostRecordLabel(record)
            : hostTargetId(relation, link);
        },
      },
      ...[
        "variant",
        "orderIndex",
        "className",
        ...(config.target ? [] : ["externalModule"]),
      ].map((key) => ({
        key,
        label: key,
        value: (link: HostLink) => hostFieldValue(link, key),
      })),
    ],
    [config, relation, state],
  );
  const actions = useMemo(
    () => [
      ...(config.target
        ? [
            {
              label: "Preview target",
              icon: "eye" as const,
              onAction: showPreview,
            },
          ]
        : []),
      { label: "Edit link", icon: "pencil-simple" as const, onAction: edit },
    ],
    [config.target, showPreview, edit],
  );
  return (
    <div
      data-ds-block={`host.${relation}.admin-v2-manager`}
      data-ds-layer="singlepage"
    >
      <Records
        title={relation.replaceAll("-", " ")}
        scope={`host / ${relation}`}
        records={sortHostLinks(
          state.relations[relation].filter(
            (link) => !ownerId || hostOwnerId(relation, link) === ownerId,
          ),
        )}
        fields={fields}
        actions={actions}
        createLabel="Link record"
        onCreate={hasOwner ? create : undefined}
        onRemove={remove}
        removalLabel="Unlink"
        removalDescription="Remove the link? Both connected records are retained."
        embedded={embedded}
        emptyState={
          <p className={`p-6 text-sm ${kit.muted}`}>
            {hasOwner
              ? "No links. Use Link record to connect existing records or create a target."
              : `Create a ${config.owner} before adding links.`}
          </p>
        }
      />
      <RecordEditor
        open={Boolean(draft)}
        onOpenChange={(open) => {
          if (!open) setDraft(null);
        }}
        title="Edit Host link"
        description="Choose connected records and their rendering order."
      >
        {draft && (
          <HostLinkForm
            key={draft.id}
            relation={relation}
            link={draft}
            fixedOwner={ownerId}
            onSaved={() => setDraft(null)}
          />
        )}
      </RecordEditor>
      {config.target && (
        <RecordEditor
          open={Boolean(preview)}
          onOpenChange={(open) => {
            if (!open) setPreview(null);
          }}
          title="Target preview"
          description="Target record with its current links."
        >
          {preview && (
            <div className="p-5">
              <HostRecordPreview model={config.target} id={preview.id} />
            </div>
          )}
        </RecordEditor>
      )}
    </div>
  );
}
function HostLinkForm({
  relation,
  link,
  fixedOwner,
  onSaved,
}: IHostLinkFormProps) {
  const { state, update } = useHostStudio();
  const config = HOST_STUDIO_RELATIONS[relation];
  const [draft, setDraft] = useState(link);
  const [targetDraft, setTargetDraft] = useState<HostRecord | null>(null);
  const [error, setError] = useState("");
  const targetId = hostTargetId(relation, draft);
  const selectedTarget = config.target
    ? state.models[config.target].find((item) => item.id === targetId)
    : null;
  return (
    <>
      <RecordForm
        onSubmit={(event) => {
          event.preventDefault();
          const issue = validateHostLink(state, relation, draft);
          if (issue) {
            setError(issue);
            return;
          }
          update((current) =>
            saveHostLink(current, relation, {
              ...draft,
              updatedAt: new Date(),
            }),
          );
          onSaved();
        }}
        footer={
          <>
            <p role="status" className={`mr-auto text-sm ${kit.muted}`}>
              {error}
            </p>
            <Button type="submit">
              <Icon name="link" />
              Save link
            </Button>
          </>
        }
      >
        <div className="grid gap-5">
          <label className="grid gap-2">
            <span className={kit.label}>Owner · {config.owner}</span>
            <Select
              aria-label="Owner"
              disabled={Boolean(fixedOwner)}
              value={hostOwnerId(relation, draft)}
              onValueChange={(value) =>
                setDraft({ ...draft, [config.ownerKey]: value })
              }
              options={state.models[config.owner].map((record) => ({
                value: record.id,
                label: hostRecordLabel(record),
              }))}
              placeholder="Select owner"
            />
          </label>
          {config.target ? (
            <div className="grid gap-3">
              <label className="grid gap-2">
                <span className={kit.label}>Target · {config.target}</span>
                <Select
                  aria-label="Target"
                  value={targetId}
                  onValueChange={(value) =>
                    setDraft({ ...draft, [config.targetKey]: value })
                  }
                  options={state.models[config.target].map((record) => ({
                    value: record.id,
                    label: hostRecordLabel(record),
                  }))}
                  placeholder="Select target"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    if (config.target)
                      setTargetDraft(
                        createHostModel(config.target, crypto.randomUUID()),
                      );
                  }}
                >
                  <Icon name="plus" />
                  Create {config.target}
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  disabled={!selectedTarget}
                  onClick={() => setTargetDraft(selectedTarget ?? null)}
                >
                  <Icon name="pencil-simple" />
                  Edit {config.target}
                </Button>
              </div>
            </div>
          ) : (
            "externalModule" in draft && (
              <>
                <label className="grid gap-2">
                  <span className={kit.label}>External module</span>
                  <input
                    list={`external-modules-${draft.id}`}
                    className={kit.field}
                    required
                    value={draft.externalModule}
                    onChange={(event) =>
                      setDraft({ ...draft, externalModule: event.target.value })
                    }
                  />
                  <datalist id={`external-modules-${draft.id}`}>
                    {HOST_STUDIO_EXTERNAL_MODULES.map((module) => (
                      <option key={module} value={module} />
                    ))}
                  </datalist>
                </label>
                <label className="grid gap-2">
                  <span className={kit.label}>External widget ID</span>
                  <input
                    className={kit.field}
                    required
                    value={draft.externalWidgetId}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        externalWidgetId: event.target.value,
                      })
                    }
                  />
                </label>
                <p className={`text-sm ${kit.muted}`}>
                  Available preview IDs: blog / preview-blog-overview-widget;
                  ecommerce / preview-ecommerce-overview-widget. Other sources
                  retain their IDs and show a placeholder until a Studio
                  renderer is connected.
                </p>
              </>
            )
          )}
          <label className="grid gap-2">
            <span className={kit.label}>
              {relation === "layouts-to-widgets"
                ? "Variant · default before page, additional after page"
                : "Variant"}
            </span>
            <input
              className={kit.field}
              required
              value={draft.variant}
              onChange={(event) =>
                setDraft({ ...draft, variant: event.target.value })
              }
            />
          </label>
          <label className="grid gap-2">
            <span className={kit.label}>Order index</span>
            <input
              type="number"
              step="1"
              className={kit.field}
              required
              value={Number.isNaN(draft.orderIndex) ? "" : draft.orderIndex}
              onChange={(event) =>
                setDraft({ ...draft, orderIndex: event.target.valueAsNumber })
              }
            />
          </label>
          <label className="grid gap-2">
            <span className={kit.label}>Class name</span>
            <input
              className={kit.field}
              value={draft.className ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, className: event.target.value || null })
              }
            />
          </label>
        </div>
      </RecordForm>
      {config.target && (
        <HostModelPanel
          model={config.target}
          record={targetDraft}
          onClose={() => setTargetDraft(null)}
          onSaved={(record) =>
            setDraft((current) => ({
              ...current,
              [config.targetKey]: record.id,
            }))
          }
        />
      )}
    </>
  );
}

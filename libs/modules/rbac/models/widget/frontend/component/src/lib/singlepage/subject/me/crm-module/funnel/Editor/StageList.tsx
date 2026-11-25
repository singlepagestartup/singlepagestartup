import { Button, settingsFormStyles } from "@sps/shared-ui-shadcn";
import type { IFunnelStage } from "@sps/crm/models/funnel/sdk/model";
import { GripVertical, ListOrdered, Plus } from "lucide-react";
import {
  memo,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";

interface IStageListProps {
  stages: IFunnelStage[];
  savedStageIds?: ReadonlySet<string>;
  selectedId: string;
  disabled: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, targetId: string) => void;
  onAdd: () => void;
}

const iconClass = "size-11 shrink-0 rounded-xl";

interface IStageRowProps {
  stage: IFunnelStage;
  selected: boolean;
  target: boolean;
  disabled: boolean;
  before?: string;
  after?: string;
  instructions: string;
  onSelect: IStageListProps["onSelect"];
  startDrag: (event: PointerEvent<HTMLButtonElement>, id: string) => void;
  moveDrag: (event: PointerEvent<HTMLButtonElement>) => void;
  endDrag: (event: PointerEvent<HTMLButtonElement>) => void;
  cancelDrag: () => void;
  move: (id: string, target?: string) => void;
}

const StageRow = memo(function StageRow({
  stage,
  selected,
  target,
  disabled,
  before,
  after,
  instructions,
  onSelect,
  startDrag,
  moveDrag,
  endDrag,
  cancelDrag,
  move,
}: IStageRowProps) {
  return (
    <li
      data-stage-key={stage.id}
      className={`flex min-w-0 items-center rounded-xl border transition-colors focus-within:bg-muted hover:bg-muted ${target ? "border-ring" : "border-border"} ${selected ? "bg-muted" : "bg-card"}`}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`${iconClass} touch-none cursor-grab text-muted-foreground hover:bg-transparent active:cursor-grabbing`}
        disabled={disabled || (!before && !after)}
        aria-label={`Изменить позицию этапа «${stage.name || "Новый этап"}»`}
        aria-describedby={instructions}
        onPointerDown={(event) => startDrag(event, stage.id)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={cancelDrag}
        onLostPointerCapture={cancelDrag}
        onKeyDown={(event) => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
          event.preventDefault();
          move(stage.id, event.key === "ArrowUp" ? before : after);
        }}
      >
        <GripVertical aria-hidden="true" className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        aria-pressed={selected}
        disabled={disabled}
        className="min-h-11 min-w-0 flex-1 justify-start whitespace-normal break-words rounded-xl px-2 py-2 text-left hover:bg-transparent aria-pressed:font-semibold"
        onClick={() => onSelect(stage.id)}
      >
        <span>
          {stage.name || "Новый этап"}
          {stage.archived && (
            <span className="text-xs text-muted-foreground"> · Архив</span>
          )}
        </span>
      </Button>
    </li>
  );
});

export function StageList({
  stages,
  savedStageIds,
  selectedId,
  disabled,
  onSelect,
  onMove,
  onAdd,
}: IStageListProps) {
  const instructions = useId();
  const list = useRef<HTMLOListElement>(null);
  const dragging = useRef<string | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const neighbors = useMemo(() => {
    const movable = savedStageIds
      ? stages.filter((stage) => savedStageIds.has(stage.id))
      : stages;
    return new Map(
      movable.map((stage, index) => [
        stage.id,
        { before: movable[index - 1]?.id, after: movable[index + 1]?.id },
      ]),
    );
  }, [savedStageIds, stages]);
  const move = useCallback(
    (id: string, target?: string) => {
      if (
        disabled ||
        !target ||
        target === id ||
        !neighbors.has(id) ||
        !neighbors.has(target)
      )
        return;
      const index = stages.findIndex((stage) => stage.id === target);
      const stage = stages.find((entry) => entry.id === id);
      if (!stage || index < 0) return;
      onMove(id, target);
      setAnnouncement(
        `${stage.name || "Новый этап"}. Позиция ${index + 1} из ${stages.length}.`,
      );
    },
    [disabled, neighbors, onMove, stages],
  );

  const destination = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const row = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-stage-key]");
      const id = row?.dataset.stageKey;
      return id && list.current?.contains(row) && neighbors.has(id)
        ? id
        : undefined;
    },
    [neighbors],
  );
  const startDrag = useCallback(
    (event: PointerEvent<HTMLButtonElement>, id: string) => {
      if (!event.isPrimary || event.button !== 0) return;
      dragging.current = id;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [],
  );
  const moveDrag = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (!dragging.current || !list.current) return;
      const bounds = list.current.getBoundingClientRect();
      const edge = 40;
      if (event.clientY < bounds.top + edge) list.current.scrollTop -= 16;
      if (event.clientY > bounds.bottom - edge) list.current.scrollTop += 16;
      setTargetId(destination(event) ?? null);
    },
    [destination],
  );
  const cancelDrag = useCallback(() => {
    dragging.current = null;
    setTargetId(null);
  }, []);
  const endDrag = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (dragging.current) move(dragging.current, destination(event));
      cancelDrag();
    },
    [cancelDrag, destination, move],
  );

  return (
    <aside
      aria-label="Этапы"
      className={`${settingsFormStyles.panel} grid gap-3`}
    >
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <ListOrdered aria-hidden="true" className="size-4" /> Этапы
      </h3>
      <p id={instructions} className="sr-only">
        Перетащите этап или переместите его стрелками вверх и вниз.
      </p>
      <ol
        ref={list}
        className="grid max-h-[60dvh] min-w-0 gap-1.5 overflow-y-auto p-1"
      >
        {stages.map((stage) => (
          <StageRow
            key={stage.id}
            stage={stage}
            selected={stage.id === selectedId}
            target={stage.id === targetId}
            disabled={disabled}
            before={neighbors.get(stage.id)?.before}
            after={neighbors.get(stage.id)?.after}
            instructions={instructions}
            onSelect={onSelect}
            startDrag={startDrag}
            moveDrag={moveDrag}
            endDrag={endDrag}
            cancelDrag={cancelDrag}
            move={move}
          />
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        className={settingsFormStyles.secondary}
        onClick={onAdd}
      >
        <Plus aria-hidden="true" className="size-4" /> Добавить этап
      </Button>
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </aside>
  );
}

import { useId } from "react";
import { Kanban, List, Search } from "lucide-react";
import { fieldClass } from "../../../shared/workflow-ui";
import {
  taskStateLabels,
  type WorkflowFixture,
  type WorkflowRelease,
} from "../../../shared/workflows";

export type ViewMode = "board" | "table";

export interface Filters {
  shop: string;
  workflow: string;
  version: string;
  assignee: string;
  state: string;
  search: string;
  view: ViewMode;
}

interface TaskFiltersProps {
  filters: Filters;
  fixture: WorkflowFixture;
  releases: WorkflowRelease[];
  current: WorkflowRelease;
  onChange: (change: Partial<Filters>) => void;
}

export function TaskFilters({
  filters,
  fixture,
  releases,
  current,
  onChange,
}: TaskFiltersProps) {
  const labelPrefix = useId();
  const releaseOptions = releases.filter(
    (release) => release.shopId === current.shopId,
  );
  const workflows = [
    ...new Map(releaseOptions.map((release) => [release.id, release])).values(),
  ];
  const versions = releaseOptions.filter(
    (release) => release.id === current.id,
  );

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-card p-3.5 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="relative w-full min-w-0 sm:max-w-md sm:flex-1">
          <span className="sr-only">Поиск задач</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            className={`${fieldClass} ps-10`}
            placeholder="Название, клиент, номер задачи"
            value={filters.search}
            onChange={(event) =>
              onChange({ search: event.currentTarget.value })
            }
          />
        </label>
        <div
          role="group"
          aria-label="Представление задач"
          className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-muted/65 p-1"
        >
          <button
            type="button"
            aria-pressed={filters.view === "board"}
            onClick={() => onChange({ view: "board" })}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-xs"
          >
            <Kanban aria-hidden="true" className="size-4" /> Канбан
          </button>
          <button
            type="button"
            aria-pressed={filters.view === "table"}
            onClick={() => onChange({ view: "table" })}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-xs"
          >
            <List aria-hidden="true" className="size-4" /> Таблица
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-[1fr_1.2fr_0.9fr_1fr_1fr]">
        <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">
          <span id={`${labelPrefix}-shop`}>Магазин</span>
          <select
            aria-labelledby={`${labelPrefix}-shop`}
            className={fieldClass}
            value={current.shopId}
            onChange={(event) =>
              onChange({
                shop: event.currentTarget.value,
                workflow: "",
                version: "",
              })
            }
          >
            {fixture.shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">
          <span id={`${labelPrefix}-workflow`}>Воронка</span>
          <select
            aria-labelledby={`${labelPrefix}-workflow`}
            className={fieldClass}
            value={current.id}
            onChange={(event) =>
              onChange({ workflow: event.currentTarget.value, version: "" })
            }
          >
            {workflows.map((workflow) => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">
          <span id={`${labelPrefix}-version`}>Версия</span>
          <select
            aria-labelledby={`${labelPrefix}-version`}
            className={fieldClass}
            value={current.version}
            onChange={(event) =>
              onChange({ version: event.currentTarget.value })
            }
          >
            {versions.map((version, index) => (
              <option key={version.version} value={version.version}>
                Версия {version.version} · {index === 0 ? "текущая" : "ранее"}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">
          <span id={`${labelPrefix}-assignee`}>Исполнитель</span>
          <select
            aria-labelledby={`${labelPrefix}-assignee`}
            className={fieldClass}
            value={filters.assignee}
            onChange={(event) =>
              onChange({ assignee: event.currentTarget.value })
            }
          >
            <option value="">Все исполнители</option>
            {fixture.people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">
          <span id={`${labelPrefix}-state`}>Состояние</span>
          <select
            aria-labelledby={`${labelPrefix}-state`}
            className={fieldClass}
            value={filters.state}
            onChange={(event) => onChange({ state: event.currentTarget.value })}
          >
            <option value="">Все состояния</option>
            {Object.entries(taskStateLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

import { settingsFormStyles } from "@sps/shared-ui-shadcn";
import { Select } from "@sps/ui-adapter";
import { Kanban as KanbanIcon, List } from "lucide-react";
import type {
  ICrmWorkspaceFunnel,
  ICrmWorkspaceParticipant,
} from "@sps/rbac/models/subject/sdk/model";
import { Field } from "./Fields";

export interface IFilters {
  funnel: string;
  assignee: string;
  status: string;
  search: string;
  view: "kanban" | "table";
}

interface ITaskFiltersProps {
  filters: IFilters;
  funnels: ICrmWorkspaceFunnel[];
  selectedFunnelId?: string;
  funnelsPending: boolean;
  participants: ICrmWorkspaceParticipant[];
  assigneeFilter?: string;
  statusFilter?: string;
  onChange: (change: Partial<IFilters>) => void;
}

export function TaskFilters({
  filters,
  funnels,
  selectedFunnelId,
  funnelsPending,
  participants,
  assigneeFilter,
  statusFilter,
  onChange,
}: ITaskFiltersProps) {
  return (
    <div className="grid min-w-0 gap-4 border-y border-border py-4">
      <div className="flex flex-wrap justify-between gap-3">
        <label className="block w-full sm:max-w-md">
          <span className="sr-only">Поиск задач</span>
          <input
            type="search"
            className={settingsFormStyles.field}
            value={filters.search}
            placeholder="Номер задачи, заказа или участника"
            onChange={(event) =>
              onChange({ search: event.currentTarget.value })
            }
          />
        </label>
        <div
          className="flex items-center gap-1 rounded-lg bg-muted p-1"
          role="group"
          aria-label="Представление задач"
        >
          <button
            type="button"
            className={settingsFormStyles.secondary}
            aria-pressed={filters.view === "kanban"}
            onClick={() => onChange({ view: "kanban" })}
          >
            <KanbanIcon aria-hidden="true" className="size-4" /> Канбан
          </button>
          <button
            type="button"
            className={settingsFormStyles.secondary}
            aria-pressed={filters.view === "table"}
            onClick={() => onChange({ view: "table" })}
          >
            <List aria-hidden="true" className="size-4" /> Таблица
          </button>
        </div>
      </div>
      <div className="grid min-w-0 gap-3 sm:grid-cols-3">
        <Field label="Воронка">
          <Select
            ui="shadcn"
            className={settingsFormStyles.field}
            value={selectedFunnelId ?? ""}
            disabled={!selectedFunnelId}
            onValueChange={(selectedValue) =>
              onChange({ funnel: selectedValue })
            }
            placeholder={funnelsPending ? "Загружаем воронки…" : "Нет воронок"}
            options={funnels.map((funnel) => ({
              value: funnel.id,
              label: funnel.name,
            }))}
          />
        </Field>
        <Field label="Исполнитель">
          <Select
            ui="shadcn"
            className={settingsFormStyles.field}
            value={assigneeFilter ?? "all"}
            onValueChange={(selectedValue) =>
              onChange({
                assignee: selectedValue === "all" ? "" : selectedValue,
              })
            }
            options={[
              { value: "all", label: "Все исполнители" },
              ...participants.map(({ id, name }) => ({
                value: id,
                label: name,
              })),
            ]}
          />
        </Field>
        <Field label="Состояние">
          <Select
            ui="shadcn"
            className={settingsFormStyles.field}
            value={statusFilter ?? "all"}
            onValueChange={(selectedValue) =>
              onChange({
                status: selectedValue === "all" ? "" : selectedValue,
              })
            }
            options={[
              { value: "all", label: "Все состояния" },
              { value: "active", label: "В работе" },
              { value: "waiting", label: "Ожидание" },
              { value: "closed", label: "Закрытые" },
            ]}
          />
        </Field>
      </div>
    </div>
  );
}

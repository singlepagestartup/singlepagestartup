"use client";

import { useState } from "react";
import { Button } from "@sps/shared-ui-shadcn";
import type { WorkflowResource } from "./resources";
import { useAdminRecords as useFunnel } from "@sps/crm/models/funnel/sdk/client";
import { useAdminRecords as useStage } from "@sps/crm/models/stage/sdk/client";
import { useAdminRecords as useTask } from "@sps/crm/models/task/sdk/client";
import { useAdminRecords as useFunnelsToStages } from "@sps/crm/relations/funnels-to-stages/sdk/client";
import { useAdminRecords as useFunnelsToTasks } from "@sps/crm/relations/funnels-to-tasks/sdk/client";
import { useAdminRecords as useTasksToStages } from "@sps/crm/relations/tasks-to-stages/sdk/client";
import { useAdminRecords as useFunnelsToEcommerceModuleStoresToProducts } from "@sps/crm/relations/funnels-to-ecommerce-module-stores-to-products/sdk/client";
import { useAdminRecords as useTasksToEcommerceModuleStoresToProducts } from "@sps/crm/relations/tasks-to-ecommerce-module-stores-to-products/sdk/client";
import { useAdminRecords as useTasksToEcommerceModuleOrders } from "@sps/crm/relations/tasks-to-ecommerce-module-orders/sdk/client";

const readers = {
  funnel: useFunnel,
  stage: useStage,
  task: useTask,
  "funnels-to-stages": useFunnelsToStages,
  "funnels-to-tasks": useFunnelsToTasks,
  "tasks-to-stages": useTasksToStages,
  "funnels-to-ecommerce-module-stores-to-products":
    useFunnelsToEcommerceModuleStoresToProducts,
  "tasks-to-ecommerce-module-stores-to-products":
    useTasksToEcommerceModuleStoresToProducts,
  "tasks-to-ecommerce-module-orders": useTasksToEcommerceModuleOrders,
} satisfies Record<WorkflowResource, unknown>;

const columns = {
  funnel: ["name", "kind", "storeId"],
  stage: ["name", "key"],
  task: ["status", "stageId", "funnelId"],
  "funnels-to-stages": ["funnelId", "stageId", "position"],
  "funnels-to-tasks": ["funnelId", "taskId"],
  "tasks-to-stages": ["taskId", "stageId", "revision"],
  "funnels-to-ecommerce-module-stores-to-products": ["funnelId", "offerId"],
  "tasks-to-ecommerce-module-stores-to-products": ["taskId", "offerId"],
  "tasks-to-ecommerce-module-orders": ["taskId", "orderId"],
} satisfies Record<WorkflowResource, string[]>;

const pageSize = 25;

export function WorkflowTable({ resource }: { resource: WorkflowResource }) {
  const [page, setPage] = useState(0);
  const useRecords = readers[resource];
  const query = useRecords({
    params: {
      limit: pageSize + 1,
      offset: page * pageSize,
      orderBy: { and: [{ column: "id", method: "asc" }] },
    },
  });
  const rows = query.data ?? [];
  return (
    <section className="grid min-w-0 gap-3" aria-label={resource}>
      <h2 className="break-words text-lg font-semibold">{resource}</h2>
      {query.isPending && <p role="status">Loading…</p>}
      {query.isError && <p role="alert">{query.error.message}</p>}
      {query.isSuccess && !rows.length && <p>No records</p>}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {["id", ...columns[resource]].map((column) => (
                  <th scope="col" key={column} className="border-b px-3 py-2">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, pageSize).map((row) => (
                <tr key={row.id} className="border-b align-top">
                  <td className="px-3 py-2">
                    <details>
                      <summary className="cursor-pointer">{row.id}</summary>
                      <pre className="mt-2 max-w-md whitespace-pre-wrap break-all text-xs">
                        {JSON.stringify(row, null, 2)}
                      </pre>
                    </details>
                  </td>
                  {columns[resource].map((column) => (
                    <td className="px-3 py-2" key={column}>
                      {String((row as Record<string, unknown>)[column] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(page > 0 || rows.length > pageSize) && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={rows.length <= pageSize}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </section>
  );
}

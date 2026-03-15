"use client";

import { IComponentProps } from "./interface";
import { ADMIN_BASE_PATH } from "@sps/shared-utils";
import { ecommerceAdminV2Models } from "../registry";

export function Component(props: IComponentProps) {
  const isCurrentModule = props.url.startsWith(`${ADMIN_BASE_PATH}/ecommerce`);
  const isOverviewRoute = props.url === `${ADMIN_BASE_PATH}/ecommerce`;

  if (!isCurrentModule) {
    return null;
  }

  return (
    <main className="flex-1 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        {isOverviewRoute ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ecommerceAdminV2Models.map((model) => (
              <model.Model
                key={`card-${model.id}`}
                variant="admin-v2-card"
                isServer={false}
              />
            ))}
          </div>
        ) : null}

        {ecommerceAdminV2Models.map((model) => (
          <model.Table
            key={`table-${model.id}`}
            isServer={false}
            url={props.url}
          />
        ))}
      </div>
    </main>
  );
}

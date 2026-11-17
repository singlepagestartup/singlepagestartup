import { Configuration as ParentConfiguration } from "@sps/shared-backend-api";
import {
  Table,
  insertSchema,
  selectSchema,
  dataDirectory,
} from "@sps/ecommerce/relations/offers-to-offers/backend/repository/database";
import { injectable } from "inversify";

@injectable()
export class Configuration extends ParentConfiguration {
  constructor() {
    super({
      repository: {
        type: "database",
        Table: Table,
        insertSchema,
        selectSchema,
        dump: {
          active: true,
          type: "json",
          directory: dataDirectory,
        },
        seed: {
          active: true,
          module: "ecommerce",
          name: "offers-to-offers",
          type: "relation",
          filters: (["sourceOfferId", "targetOfferId", "variant"] as const).map(
            (column) => ({
              column,
              method: "eq",
              value: (data) => {
                if (column === "variant") {
                  return data.entity.dump.variant;
                }
                const id = data.entity.dump[column];
                const offers = data.seeds.find(
                  (seed) =>
                    seed.module === "ecommerce" &&
                    seed.type === "relation" &&
                    seed.name === "stores-to-products",
                );
                return (
                  offers?.seeds.find((offer) => offer.dump.id === id)?.new
                    ?.id ?? id
                );
              },
            }),
          ),
          transformers: (["sourceOfferId", "targetOfferId"] as const).map(
            (field) => ({
              field,
              transform: (data) => {
                const id = data.entity.dump[field];
                const offers = data.seeds.find(
                  (seed) =>
                    seed.module === "ecommerce" &&
                    seed.type === "relation" &&
                    seed.name === "stores-to-products",
                );
                return (
                  offers?.seeds.find((offer) => offer.dump.id === id)?.new
                    ?.id ?? id
                );
              },
            }),
          ),
        },
      },
    });
  }
}

import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/notification/models/template/backend/repository/database";
import { HOST_SERVICE_URL, RBAC_SECRET_KEY } from "@sps/shared-utils";
import QueryString from "qs";
import pako from "pako";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  async render(params: { id: string; type: "email"; payload?: any }) {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Secret key not found");
    }

    if (!HOST_SERVICE_URL) {
      throw new Error("Host Service Url not found");
    }

    const template = await this.findById({
      id: params.id,
    });

    if (!template) {
      throw new Error("Template not found");
    }

    if (params.type === "email") {
      let queryData: undefined | string;

      if (params?.payload) {
        const deflatedData = pako.deflate(JSON.stringify(params.payload));

        const stringifiedData = Buffer.from(deflatedData).toString("base64");

        queryData = stringifiedData;
      }

      const query = QueryString.stringify(
        {
          variant: template.variant,
          data: queryData,
        },
        {
          encodeValuesOnly: true,
        },
      );

      const data = await fetch(
        HOST_SERVICE_URL + "/api/email-generator/index.html?" + query,
        {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      ).then((res) => res.text());

      return data;
    }

    throw new Error("Passed render type is not supported");
  }
}

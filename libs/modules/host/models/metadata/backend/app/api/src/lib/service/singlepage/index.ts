import "reflect-metadata";
import { injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/host/models/metadata/backend/repository/database";
import { SeoService } from "./seo";
import {
  RoutingService,
  type IRouteSource,
} from "@sps/host/models/page/backend/app/api/src/lib/service/singlepage/routing";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  readonly seo = new SeoService({
    find: ({ params }) => this.find({ params }),
  });

  configureRouting(sources: IRouteSource[]) {
    this.seo.routing = new RoutingService(sources);
  }
}

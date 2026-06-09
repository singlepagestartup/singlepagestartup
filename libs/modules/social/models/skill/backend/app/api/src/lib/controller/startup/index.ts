import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI } from "@sps/shared-backend-api";
import { Service } from "../../service";
import { Controller as ParentController } from "../singlepage";

@injectable()
export class Controller extends ParentController {
  constructor(@inject(DI.IService) service: Service) {
    super(service);
  }
}

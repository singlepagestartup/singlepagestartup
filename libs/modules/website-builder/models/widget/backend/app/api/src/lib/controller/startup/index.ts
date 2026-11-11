import "reflect-metadata";
import { inject, injectFromBase, injectable } from "inversify";
import { DI } from "@sps/shared-backend-api";
import { Service } from "../../service";
import { Controller as ParentController } from "../singlepage";

@injectable()
@injectFromBase()
export class Controller extends ParentController {}

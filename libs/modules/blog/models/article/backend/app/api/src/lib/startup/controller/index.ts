import "reflect-metadata";
import { injectable } from "inversify";
import { Controller as BaseController } from "../../singlepage";

@injectable()
export class Controller extends BaseController {}

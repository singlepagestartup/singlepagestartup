import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { Service as ParentService } from "../../singlepage/find-by-id/quantity";

@injectable()
@injectFromBase()
export class Service extends ParentService {}

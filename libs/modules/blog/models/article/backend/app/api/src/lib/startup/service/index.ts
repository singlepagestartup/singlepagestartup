import "reflect-metadata";
import { injectable } from "inversify";
import { Service as BaseService } from "../../singlepage/service";

@injectable()
export class Service extends BaseService {}

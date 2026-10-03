import "reflect-metadata";
import { injectable } from "inversify";
import { Service as ParentService } from "../singlepage";

@injectable()
export class Service extends ParentService {}

import "reflect-metadata";
import { injectable } from "inversify";
import { Service as ParentService } from "../../../singlepage/ecommerce/order/proceed";

@injectable()
export class Service extends ParentService {}

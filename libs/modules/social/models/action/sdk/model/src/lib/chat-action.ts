import type { IModel } from "./index";
import type { IProfilePresentation } from "@sps/social/models/profile/sdk/model";

/** Sender badges returned only by a caller-authorized Chat operation. */
export interface IChatAction extends IModel {
  actorProfileIds: string[];
  actorProfiles: IProfilePresentation[];
}

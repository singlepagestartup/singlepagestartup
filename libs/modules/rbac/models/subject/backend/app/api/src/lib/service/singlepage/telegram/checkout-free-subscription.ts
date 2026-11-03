import {
  Service as FreeSubscription,
  type IExecuteProps,
} from "../billing/free-subscription";

export type {
  IConstructorProps,
  IExecuteProps,
} from "../billing/free-subscription";

export class Service extends FreeSubscription {
  async execute(props: IExecuteProps) {
    if (!props.chatId) return null;
    return super.execute(props);
  }
}

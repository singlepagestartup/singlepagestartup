import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Repository } from "../../repository";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import { Service as Logout } from "./logout";
import {
  Service as Refresh,
  IExecuteProps as IRefreshExecuteProps,
} from "./refresh";
import {
  Service as AuthenticationEmailAndPassword,
  IExecuteProps as IAuthenticationEmailAndPasswordExecuteProps,
} from "./authentication/email-and-password";
import {
  Service as IsAuthorized,
  IExecuteProps as IIsAuthorizedExecuteProps,
} from "./is-authorized";
import {
  Service as AuthenticationEthereumVirtualMachine,
  IExecuteProps as IAuthenticationEthereumVirtualMachineExecuteProps,
} from "./authentication/ethereum-virtual-machine";
import {
  Service as DeleteAnonymousSubjects,
  IExecuteProps as IDeleteAnonymousSubjectsExecuteProps,
} from "./delete-anonymous-subjects";
import {
  Service as Deanonymize,
  IExecuteProps as IDeanonymizeExecuteProps,
} from "./deanonymize";
import {
  Service as EcommerceOrderCheckout,
  IExecuteProps as IEcommerceOrderCheckoutExecuteProps,
} from "./ecommerce/order/checkout";
import {
  Service as ChatSubjectsWithSocialModuleProfiles,
  IExecuteProps as IChatSubjectsWithSocialModuleProfilesProps,
} from "./social-module/chat-subjects-with-social-module-profiles";
import {
  Service as BillRoute,
  IExecuteProps as IBillRouteProps,
} from "./bill-route";
import {
  Service as EcommerceOrderProceed,
  IExecuteProps as IEcommerceOrderProceedProps,
} from "./ecommerce/order/proceed";

@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {
  constructor(@inject(DI.IRepository) repository: Repository) {
    super(repository);
  }

  async isAuthorized(props: IIsAuthorizedExecuteProps): Promise<any> {
    return new IsAuthorized(this.repository).execute(props);
  }

  async logout(): Promise<any> {
    return new Logout(this.repository).execute();
  }

  async refresh(props: IRefreshExecuteProps) {
    return new Refresh(this.repository).execute(props);
  }

  async authenticationLoginAndPassowrd(
    props: IAuthenticationEmailAndPasswordExecuteProps,
  ) {
    return new AuthenticationEmailAndPassword(this.repository).execute(props);
  }

  async authenticationEthereumVirtualMachine(
    props: IAuthenticationEthereumVirtualMachineExecuteProps,
  ) {
    return new AuthenticationEthereumVirtualMachine(this.repository).execute(
      props,
    );
  }

  async deleteAnonymousSubjects(props?: IDeleteAnonymousSubjectsExecuteProps) {
    return new DeleteAnonymousSubjects(this.repository).execute(props);
  }

  async deanonymize(props: IDeanonymizeExecuteProps) {
    return new Deanonymize(this.repository).execute(props);
  }

  async ecommerceOrderCheckout(props: IEcommerceOrderCheckoutExecuteProps) {
    return new EcommerceOrderCheckout(this.repository).execute(props);
  }

  async socialModuleChatSubjectsWithSocialModuleProfiles(
    props: IChatSubjectsWithSocialModuleProfilesProps,
  ) {
    return new ChatSubjectsWithSocialModuleProfiles(this.repository).execute(
      props,
    );
  }

  async billRoute(props: IBillRouteProps) {
    return new BillRoute(this.repository).execute(props);
  }

  async ecommerceOrderProceed(props: IEcommerceOrderProceedProps) {
    return new EcommerceOrderProceed(this.repository).execute(props);
  }
}

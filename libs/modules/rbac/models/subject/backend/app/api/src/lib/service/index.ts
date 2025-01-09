import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI } from "@sps/shared-backend-api";
import { Repository } from "../repository";
import { Table } from "@sps/rbac/models/subject/backend/repository/database";
import { Service as Logout } from "./logout";
import {
  Service as Refresh,
  IExecuteProps as IRefreshExecuteProps,
} from "./refresh";
import {
  Service as AuthenticationLoginAndPassword,
  IExecuteProps as IAuthenticationLoginAndPasswordExecuteProps,
} from "./authentication/login-and-password";
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
  Service as EcommerceOrdersCheckout,
  IExecuteProps as IEcommerceOrdersCheckoutExecuteProps,
} from "./ecommerce/orders-checkout";

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
    props: IAuthenticationLoginAndPasswordExecuteProps,
  ) {
    return new AuthenticationLoginAndPassword(this.repository).execute(props);
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

  async ecommerceOrdersCheckout(props: IEcommerceOrdersCheckoutExecuteProps) {
    return new EcommerceOrdersCheckout(this.repository).execute(props);
  }
}

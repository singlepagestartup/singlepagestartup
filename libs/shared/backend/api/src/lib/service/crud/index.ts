import "reflect-metadata";
import { inject, injectable } from "inversify";
import {
  FindAction,
  FindByIdAction,
  CreateAction,
  UpdateAction,
  DeleteAction,
  DumpAction,
} from "./actions";
import { DI } from "../../di/constants";
import { type IRepository } from "../../repository/interface";
import { IService } from "../interface";
import { FindServiceProps } from "../../services/interfaces";

@injectable()
export class Service<DTO extends Record<string, unknown>>
  implements IService<DTO>
{
  repository: IRepository;

  constructor(@inject(DI.IRepository) repository: IRepository) {
    this.repository = repository;
  }

  async find(props?: FindServiceProps): Promise<DTO[]> {
    const action = new FindAction(this.repository);
    return action.execute(props);
  }

  async findById(props: { id: string }): Promise<DTO | null> {
    const action = new FindByIdAction(this.repository);
    return action.execute(props);
  }

  async create(props: { data: any }): Promise<any | null> {
    const action = new CreateAction(this.repository);
    return action.execute(props);
  }

  async delete(props: { id: string }): Promise<DTO> {
    const action = new DeleteAction(this.repository);
    return action.execute(props);
  }

  async update(props: { id: string; data: DTO }): Promise<DTO | null> {
    const action = new UpdateAction(this.repository);
    return action.execute(props);
  }

  async dump(): Promise<DTO[]> {
    const action = new DumpAction(this.repository);
    return action.execute();
  }
}

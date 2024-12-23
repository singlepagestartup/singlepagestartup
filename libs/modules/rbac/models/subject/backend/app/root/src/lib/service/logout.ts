import { IRepository } from "@sps/shared-backend-api";

export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute() {
    return {
      ok: true,
    };
  }
}

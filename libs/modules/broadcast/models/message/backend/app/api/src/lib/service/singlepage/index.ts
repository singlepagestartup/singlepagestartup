import "reflect-metadata";
import { inject, injectable } from "inversify";
import { CRUDService, DI, type IRepository } from "@sps/shared-backend-api";
import { logger } from "@sps/backend-utils";
import type { ISelectSchema } from "@sps/broadcast/models/message/backend/repository/database";
import { Repository } from "../../repository";
import { MessageDI } from "../../di";

@injectable()
export class Service extends CRUDService<ISelectSchema> {
  declare repository: Repository;
  private nextCleanup = 0;

  constructor(
    @inject(DI.IRepository) repository: Repository,
    @inject(MessageDI.IPayloadRepository)
    private readonly payloadRepository: Pick<IRepository, "findFirstByField">,
  ) {
    super(repository);
  }

  // Internal read. The higher owner checks visible membership before using it.
  // This method is not registered as an HTTP route.
  async findPayloadById(props: { id: string }): Promise<ISelectSchema | null> {
    const message = await this.payloadRepository.findFirstByField(
      "id",
      props.id,
    );
    return message ?? null;
  }

  async create(props: { data: any }) {
    const message = await super.create(props);
    if (Date.now() >= this.nextCleanup) {
      this.nextCleanup = Infinity;
      try {
        const removed = await this.repository.deleteExpired(100, new Date());
        this.nextCleanup = removed.length === 100 ? 0 : Date.now() + 60_000;
      } catch (error) {
        this.nextCleanup = Date.now() + 60_000;
        logger.error("Broadcast message cleanup failed", error);
      }
    }
    return message;
  }

  async deleteExpired() {
    const before = new Date();
    let removed = await this.repository.deleteExpired(100, before);
    while (removed.length === 100) {
      removed = await this.repository.deleteExpired(100, before);
    }
  }

  async update(props: { id: string; data: ISelectSchema }) {
    await this.requireOrdinaryMessage(props.id);
    return super.update(props);
  }

  async delete(props: { id: string }) {
    await this.requireOrdinaryMessage(props.id);
    return super.delete(props);
  }

  async requireOrdinaryMessage(id: string) {
    const message = await this.findPayloadById({ id });
    if (message && message.expiresAt === null) {
      throw new Error(
        "Conflict error. Use the delivery queue to modify a durable message",
      );
    }
  }
}

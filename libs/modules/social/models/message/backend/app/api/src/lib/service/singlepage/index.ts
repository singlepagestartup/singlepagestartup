import { createModule } from "../module";
import { createModules } from "@sps/social/backend/app/api/src/lib/modules";
import "reflect-metadata";
import { injectFromBase, injectable } from "inversify";
import { CRUDService } from "@sps/shared-backend-api";
import { Table } from "@sps/social/models/message/backend/repository/database";
import type { Repository } from "../../repository";

type Message = typeof Table.$inferSelect;

@injectable()
@injectFromBase()
export class Service extends CRUDService<Message> {
  get modules() {
    return this.appAssembly.getOrCreate(createModules);
  }

  get module() {
    return this.appAssembly.getOrCreate(createModule);
  }

  bindWorkReply(id: string, key: string, interaction?: Message["interaction"]) {
    return (this.repository as Repository).bindWorkReply(id, key, interaction);
  }

  createWorkMessage(
    data: Pick<Message, "description"> & {
      metadata?: Message["metadata"];
      interaction?: Message["interaction"];
      sourceSystemId?: string;
    },
  ) {
    return super.insert({
      ...data,
      variant: "customer-work",
      createdAt: new Date(),
    });
  }

  protected override insert(data: Record<string, unknown>) {
    this.assertOrdinary(data);
    return super.insert(data);
  }

  override async update(props: { id: string; data: Partial<Message> }) {
    this.assertOrdinary(props.data);
    await this.assertEditable(props.id);
    return super.update(props);
  }

  override async delete(props: { id: string }) {
    await this.assertEditable(props.id);
    return super.delete(props);
  }

  private async assertEditable(id: string) {
    const message = await this.findById({ id });
    if (message) {
      this.assertOrdinary(message);
    }
  }

  private assertOrdinary(data: { variant?: unknown; workReplyKey?: unknown }) {
    if (data.variant === "customer-work" || data.workReplyKey) {
      throw new Error(
        "Forbidden error. Work conversation messages use the assigned workflow",
      );
    }
  }
}

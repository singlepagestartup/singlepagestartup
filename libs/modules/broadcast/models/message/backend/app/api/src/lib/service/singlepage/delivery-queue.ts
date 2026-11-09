import { randomUUID } from "node:crypto";
import type {
  IEnqueueMessage,
  IDeliveryOwner,
  Repository,
} from "../../repository";

export type IDeliveryState = Awaited<
  ReturnType<Repository["deliveryStates"]>
>[number];
export interface ISelection {
  key: string;
  previous: string | null;
  payload?: (receipt: string) => string;
}
interface IReserve {
  channelId: string;
  concurrency: number;
  leaseSeconds: number;
  // A recurring consumer may explicitly select a completed message for another run.
  schedule?: {
    keys: string[];
    select: (states: IDeliveryState[], now: Date) => ISelection[];
  };
}

export class DeliveryQueue {
  constructor(private readonly repository: Repository) {}

  async publish(message: IEnqueueMessage) {
    if (!message.key.trim()) {
      throw new Error("Validation error. A delivery key is required");
    }
    return this.repository.publishDelivery(message);
  }

  states(channelId: string, keys: string[]) {
    return this.repository.deliveryStates(channelId, keys);
  }

  async reserve(props: IReserve) {
    this.positiveInteger(props.concurrency);
    this.positiveInteger(props.leaseSeconds);
    const reserved = await this.repository.withDeliveryQueue(
      props.channelId,
      async (now) => {
        const active = await this.repository.activeDeliveryCount(
          props.channelId,
          now,
        );
        const slots = props.concurrency - active;
        if (slots <= 0) {
          return [];
        }

        let candidates: ISelection[];
        if (props.schedule) {
          const states = await this.states(
            props.channelId,
            props.schedule.keys,
          );
          candidates = props.schedule.select(states, now);
        } else {
          const ready = await this.repository.readyDeliveries(
            props.channelId,
            now,
            slots,
          );
          candidates = ready.flatMap((row) =>
            row.key ? [{ key: row.key, previous: row.receipt }] : [],
          );
        }

        const result: Array<IDeliveryOwner & { id: string; payload: string }> =
          [];
        const leaseUntil = new Date(now.getTime() + props.leaseSeconds * 1000);
        for (const candidate of candidates) {
          if (result.length >= slots) {
            break;
          }
          const owner = {
            channelId: props.channelId,
            key: candidate.key,
            receipt: randomUUID(),
          };
          const message = await this.repository.reserveDelivery(
            owner,
            candidate.previous,
            now,
            leaseUntil,
            candidate.payload?.(owner.receipt),
          );
          if (message) {
            result.push({ ...owner, ...message });
          }
        }
        return result;
      },
    );
    return reserved ?? [];
  }

  start(owner: IDeliveryOwner) {
    return this.repository.startDelivery(owner);
  }

  renew(owner: IDeliveryOwner, seconds: number) {
    this.positiveInteger(seconds);
    return this.repository.renewDelivery(owner, seconds);
  }

  acknowledge(owner: IDeliveryOwner, payload?: string, pendingOnly = false) {
    return this.repository.acknowledgeDelivery(owner, payload, pendingOnly);
  }

  release(owner: IDeliveryOwner) {
    return this.repository.releaseDelivery(owner);
  }

  async removeCompleted(channelId: string, before: Date, limit: number) {
    this.positiveInteger(limit);
    const removedMessages = await this.repository.removeCompleted(
      channelId,
      before,
      limit,
    );

    return removedMessages.length;
  }

  owns(owner: IDeliveryOwner) {
    return this.repository.ownsDelivery(owner);
  }

  private positiveInteger(value: number) {
    if (!Number.isSafeInteger(value) || value < 1 || value > 2147483647) {
      throw new Error("Validation error. Expected a positive 32-bit integer");
    }
  }
}

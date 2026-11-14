import { KV_COMMAND_TIMEOUT_MS } from "@sps/shared-utils";

export interface IAtomicStore {
  eval(props: {
    prefix: string;
    key: string;
    script: string;
    args: string[];
  }): Promise<unknown>;
}

/** Bounds infrastructure calls without creating a retry queue. */
export async function atomicStoreOperation(
  store: IAtomicStore,
  props: Parameters<IAtomicStore["eval"]>[0],
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      store.eval(props),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("KV operation timed out")),
          KV_COMMAND_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

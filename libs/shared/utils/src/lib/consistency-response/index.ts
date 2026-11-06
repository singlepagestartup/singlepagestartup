import type { IConsistencyMetadata } from "../types/consistency";

export interface IConsistencyResponse {
  url: string;
  metadata?: IConsistencyMetadata;
}
const observers = new Set<
  (response: IConsistencyResponse) => void | Promise<void>
>();
/** Transport observation is generic; backend contexts and browser SDKs own policy. */
export function observeConsistencyResponses(
  observer: (response: IConsistencyResponse) => void | Promise<void>,
) {
  observers.add(observer);
  return () => {
    observers.delete(observer);
  };
}
export async function publishConsistencyResponse(
  response: IConsistencyResponse,
) {
  for (const observer of observers) await observer(response);
}

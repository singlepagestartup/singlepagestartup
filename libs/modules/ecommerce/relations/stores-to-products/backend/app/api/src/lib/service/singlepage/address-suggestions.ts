import type {
  IAddressSuggestionsInput,
  IAddressSuggestionsResult,
} from "@sps/ecommerce/relations/stores-to-products/sdk/model";
import type { Repository } from "../../repository";
import type { IDeliveryRouting } from "./quote/routing";

export interface IConstructorProps {
  repository: Pick<Repository, "addressSuggestionsOffer">;
  routing: () => IDeliveryRouting;
}

export class Service {
  constructor(private readonly dependencies: IConstructorProps) {}

  async execute(
    input: IAddressSuggestionsInput,
    signal?: AbortSignal,
  ): Promise<IAddressSuggestionsResult> {
    const query = input.query.trim();
    if (
      query.length < 3 ||
      query.length > 500 ||
      !/^[a-z]{2}$/i.test(input.language)
    ) {
      throw new Error("Validation error. Invalid address suggestions request");
    }
    const details = await this.dependencies.repository.addressSuggestionsOffer(
      input.offerId,
    );
    const offer = details?.offer;
    const product = details?.product;
    if (
      !offer ||
      offer.variant !== "default" ||
      !product ||
      product.variant !== "default" ||
      product.kind !== "service"
    ) {
      throw new Error("Not Found error. Shipping offer is unavailable");
    }
    let shipping = offer.settings.receiptMethod === "shipping";
    if (!offer.settings.receiptMethod) {
      shipping = details?.hasDeliveryLink ?? false;
    }
    if (!shipping) {
      throw new Error("Not Found error. Shipping offer is unavailable");
    }
    const adapter = this.dependencies.routing();
    if (!adapter.suggestAddresses) {
      return { suggestions: [] };
    }
    let values: IAddressSuggestionsResult;
    try {
      values = await adapter.suggestAddresses(
        query,
        input.language.toLowerCase(),
        offer.settings.regionIds,
        signal,
      );
    } catch {
      throw new Error("Delivery address suggestions are unavailable");
    }
    if (!Array.isArray(values?.suggestions)) {
      throw new Error("Delivery address suggestions are unavailable");
    }
    const result: string[] = [];
    const seen = new Set<string>();
    for (const value of values.suggestions) {
      if (typeof value !== "string") {
        continue;
      }
      const address = value.trim();
      const key = address.toLocaleLowerCase();
      if (
        address.length < 3 ||
        address.length > 500 ||
        /[\u0000-\u001f\u007f]/.test(address) ||
        seen.has(key)
      ) {
        continue;
      }
      seen.add(key);
      result.push(address);
      if (result.length === 5) {
        break;
      }
    }
    return {
      suggestions: result,
      ...(values.attribution ? { attribution: values.attribution } : {}),
    };
  }
}

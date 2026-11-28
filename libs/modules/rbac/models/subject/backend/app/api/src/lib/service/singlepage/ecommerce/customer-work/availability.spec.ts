/**
 * BDD Suite: visible work rates for a retail service.
 * Given: an offer, its published workflow and a reference wallet top-up pack.
 * When: the buyer requests availability for the selected offer.
 * Then: the response gives the wallet rates for the published model selections.
 */
import { OPEN_AI_STAGE_TEXT_DEFAULT } from "@sps/shared-utils";
import { ProviderConnections } from "../../provider-connections";
import { TokenTopupRate } from "../../billing/token-topup-rate";
import { Service } from "./index";
import { assertApprovedWorkRate } from "./utils";

const scope = { productId: "product", storeId: "store", offerId: "offer" };
const workTokenPricing = { currencyId: "token", multiplier: "2" };

function fixture(formulaPricing = false) {
  const pricing = formulaPricing ? { currencyId: "token" } : workTokenPricing;
  const settings = {
    standalone: true,
    requiresResultAcceptance: !formulaPricing,
    workTokenPricing: pricing,
  };
  const offers = [
    { id: scope.offerId, ...scope, variant: "default", settings },
  ];
  const definition = {
    initialStageId: "intake",
    stages: ["intake", "prepare"].map((id) => ({
      id,
      provider: {
        modelId: OPEN_AI_STAGE_TEXT_DEFAULT.modelId,
        reasoning: "medium",
      },
      workFunding: {
        payer: "customer",
        ...pricing,
        ...(formulaPricing && { orderFormula: true }),
      },
      operations: ["knowledge-search"],
      resultPricing:
        !formulaPricing && id === "prepare"
          ? { kind: "work-tokens" }
          : undefined,
    })),
  };
  const attribute = (type: string, slug: string, amount: string) => ({
    attribute: {
      number: amount,
      attributeKeysToAttribute: [{ attributeKey: { type } }],
      attributesToBillingModuleCurrencies: [
        { billingModuleCurrency: { id: slug, slug } },
      ],
    },
  });
  const topup = jest.fn().mockResolvedValue({
    id: "reference-pack",
    productsToAttributes: [
      attribute("price", "usd", "2"),
      attribute("topup", "token", "1000"),
    ],
  });
  const catalogTariff = {
    formula:
      "provider_usd * topup_tokens / topup_usd * work_markup_percent / 100",
    formulaVersion: "2",
    currencyId: "token",
    inputs: { work_markup_percent: "250" },
  };
  const subject = {
    modules: {
      ecommerce: {
        product: {
          findById: jest
            .fn()
            .mockResolvedValue({ id: scope.productId, kind: "service" }),
          findByIdExtended: topup,
        },
        storesToProducts: {
          offersForProduct: jest.fn().mockResolvedValue(offers),
          workTokenTariff: jest.fn().mockResolvedValue(catalogTariff),
        },
      },
      crm: {
        funnel: {
          resolve: jest.fn(async ({ kind }) =>
            kind === "individual-service" ? { definition } : null,
          ),
        },
      },
    },
  };
  const vault = { read: jest.fn() };
  const providerConnections = new ProviderConnections(
    subject as never,
    vault as never,
  );
  return {
    definition,
    service: new Service({ ...subject, providerConnections } as never),
    offers,
    topup,
    vault,
    catalogTariff,
    providerConnections,
  };
}

it("uses the Product formula for live rates and keeps pinned settlement terms", async () => {
  const { service, catalogTariff, providerConnections } = fixture(true);
  const first = await service.availability(scope);
  expect(first.workMetered).toBe(true);
  expect(first.payAfterAcceptance).toBe(false);
  expect(first.workTokenTariff?.rates[0].input).toBe("0.01");
  const customerPricing = {
    currencyId: "token",
    workTokenTariff: catalogTariff,
  };
  const funding =
    await providerConnections.serverWorkFundingTerms(customerPricing);
  const terms = await providerConnections.serverWorkRate("text", funding);
  expect(TokenTopupRate.workCharge("0.08", terms).toFixed()).toBe("100");
  expect(TokenTopupRate.workCharge("0.08", terms, "1").toFixed()).toBe("40");

  catalogTariff.inputs.work_markup_percent = "400";
  expect(
    (await service.availability(scope)).workTokenTariff?.rates[0].input,
  ).toBe("0.016");
  expect(TokenTopupRate.workCharge("0.08", terms).toFixed()).toBe("100");
});

it.each([false, true])(
  "requires consent for the chosen model and actual dispatch terms (Product formula %s)",
  async (formula) => {
    const { providerConnections, catalogTariff } = fixture(formula);
    const funding = await providerConnections.serverWorkFundingTerms(
      formula
        ? { currencyId: "token", workTokenTariff: catalogTariff }
        : undefined,
    );
    const rate = await providerConnections.serverWorkRate("text", funding);
    expect(() =>
      assertApprovedWorkRate([rate], "text", {
        model: rate.model,
        provider: rate.provider,
        terms: rate,
      }),
    ).not.toThrow();
    expect(() =>
      assertApprovedWorkRate([rate], "text", {
        model: "unapproved",
        provider: rate.provider,
        terms: rate,
      }),
    ).toThrow("approve the current stage rate");
    expect(() =>
      assertApprovedWorkRate([rate], "text", {
        model: rate.model,
        provider: rate.provider,
        terms: {
          ...rate,
          outputUsdPerMillion: "1000",
        },
      }),
    ).toThrow("approve the current stage rate");
  },
);

it("converts the configured model and retrieval rates using the actual wallet pack", async () => {
  const { service, topup, vault } = fixture();
  await expect(service.availability(scope)).resolves.toEqual({
    consultation: false,
    order: true,
    payAfterAcceptance: false,
    workMetered: true,
    workTokenTariff: {
      rates: [
        {
          capability: "text",
          model: OPEN_AI_STAGE_TEXT_DEFAULT.modelId,
          input: "0.008",
          cachedInput: "0.0004",
          cacheWrite: "0.01",
          output: "0.04",
        },
        {
          capability: "embedding",
          model: "text-embedding-3-large",
          input: "0.00013",
        },
      ],
    },
  });
  expect(topup).toHaveBeenCalledTimes(1);
  expect(vault.read).not.toHaveBeenCalled();
});

it("withholds the rate when the offer, workflow or reference pack cannot be used", async () => {
  const { service, definition, offers, topup } = fixture();
  await expect(
    service.availability({ ...scope, storeId: "different-store" }),
  ).resolves.toEqual({
    consultation: false,
    order: false,
    payAfterAcceptance: false,
  });
  expect(topup).not.toHaveBeenCalled();

  definition.stages[1].workFunding = {
    ...workTokenPricing,
    payer: "store-owner",
  };
  const invalidWorkflow = await service.availability(scope);
  expect(invalidWorkflow.workTokenTariff).toBeUndefined();
  expect(topup).not.toHaveBeenCalled();

  definition.stages[1].workFunding.payer = "customer";
  topup.mockResolvedValue({ id: "empty-pack" });
  const missingPrice = await service.availability(scope);
  expect(missingPrice.workTokenTariff).toBeUndefined();

  delete (offers[0].settings as Partial<(typeof offers)[0]["settings"]>)
    .workTokenPricing;
  await expect(service.availability(scope)).resolves.toEqual({
    consultation: false,
    order: true,
    payAfterAcceptance: true,
  });
});

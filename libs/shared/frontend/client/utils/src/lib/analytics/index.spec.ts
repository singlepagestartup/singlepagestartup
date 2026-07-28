/**
 * BDD Suite: Shared analytics event tracking.
 *
 * Given: product UI events need one shared analytics dispatch layer.
 * When: callers track a flat event with metadata.
 * Then: the layer sends the event to available Yandex and Google providers without breaking UI flows.
 */

describe("shared analytics event tracking", () => {
  const originalWindow = global.window;
  const originalEnv = process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;

  const importTracker = async () => {
    jest.resetModules();

    return import("./index");
  };

  const setWindow = (value: Partial<Window>) => {
    Object.defineProperty(global, "window", {
      configurable: true,
      value,
    });
  };

  afterEach(() => {
    jest.restoreAllMocks();

    if (originalEnv === undefined) {
      delete process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID;
    } else {
      process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID = originalEnv;
    }

    Object.defineProperty(global, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  /**
   * BDD Scenario
   * Given: analytics is called while rendering outside the browser.
   * When: no window object is available.
   * Then: tracking exits without throwing.
   */
  it("no-ops without a browser window", async () => {
    Object.defineProperty(global, "window", {
      configurable: true,
      value: undefined,
    });

    const { trackAnalyticsEvent } = await importTracker();

    expect(() => {
      trackAnalyticsEvent({
        name: "website_builder_button_click",
      });
    }).not.toThrow();
  });

  /**
   * BDD Scenario
   * Given: Yandex Metrika is loaded and the public counter id is configured.
   * When: a website-builder button click is tracked.
   * Then: reachGoal receives the event name and normalized metadata.
   */
  it("sends website-builder button clicks to Yandex Metrika", async () => {
    const ym = jest.fn();

    process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID = "12345678";
    setWindow({
      ym,
    });

    const { trackAnalyticsEvent } = await importTracker();

    trackAnalyticsEvent({
      name: "website_builder_button_click",
      metadata: {
        id: "button-id",
        module: "website-builder",
        model: "button",
        variant: "primary",
        ignored: undefined,
      },
    });

    expect(ym).toHaveBeenCalledWith(
      12345678,
      "reachGoal",
      "website_builder_button_click",
      {
        id: "button-id",
        module: "website-builder",
        model: "button",
        variant: "primary",
      },
    );
  });

  /**
   * BDD Scenario
   * Given: Google Tag Manager's dataLayer is available.
   * When: a website-builder button click is tracked.
   * Then: the event is pushed to dataLayer.
   */
  it("uses dataLayer for Google tracking when available", async () => {
    const push = jest.fn();
    const gtag = jest.fn();

    setWindow({
      dataLayer: {
        push,
      } as unknown as Window["dataLayer"],
      gtag,
    });

    const { trackAnalyticsEvent } = await importTracker();

    trackAnalyticsEvent({
      name: "website_builder_button_click",
      metadata: {
        id: "button-id",
        module: "website-builder",
        model: "button",
        variant: "link",
      },
    });

    expect(push).toHaveBeenCalledWith({
      event: "website_builder_button_click",
      id: "button-id",
      module: "website-builder",
      model: "button",
      variant: "link",
    });
    expect(gtag).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: Google Analytics is available without Google Tag Manager.
   * When: a website-builder button click is tracked.
   * Then: the event is sent through gtag.
   */
  it("falls back to gtag when dataLayer is unavailable", async () => {
    const gtag = jest.fn();

    setWindow({
      gtag,
    });

    const { trackAnalyticsEvent } = await importTracker();

    trackAnalyticsEvent({
      name: "website_builder_button_click",
      metadata: {
        id: "button-id",
        module: "website-builder",
        model: "button",
        variant: "default",
      },
    });

    expect(gtag).toHaveBeenCalledWith("event", "website_builder_button_click", {
      id: "button-id",
      module: "website-builder",
      model: "button",
      variant: "default",
    });
  });

  /**
   * BDD Scenario
   * Given: both Google Tag Manager and Google Analytics globals are present.
   * When: a website-builder button click is tracked.
   * Then: only dataLayer receives the event to avoid duplicate Google tracking.
   */
  it("does not duplicate Google events when dataLayer and gtag both exist", async () => {
    const push = jest.fn();
    const gtag = jest.fn();

    setWindow({
      dataLayer: {
        push,
      } as unknown as Window["dataLayer"],
      gtag,
    });

    const { trackAnalyticsEvent } = await importTracker();

    trackAnalyticsEvent({
      name: "website_builder_button_click",
      metadata: {
        id: "button-id",
        module: "website-builder",
        model: "button",
        variant: "ghost",
      },
    });

    expect(push).toHaveBeenCalledTimes(1);
    expect(gtag).not.toHaveBeenCalled();
  });
});

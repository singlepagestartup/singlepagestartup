describe("the configured maximum quantity per order line", () => {
  const original = process.env.ECOMMERCE_ORDER_LINE_MAX_QUANTITY;

  function readMaximum(value?: string): number {
    if (value === undefined) {
      delete process.env.ECOMMERCE_ORDER_LINE_MAX_QUANTITY;
    } else {
      process.env.ECOMMERCE_ORDER_LINE_MAX_QUANTITY = value;
    }
    let max = 0;
    jest.isolateModules(() => {
      max =
        jest.requireActual("./ecommerce").ECOMMERCE_ORDER_LINE_QUANTITY_BOUNDS
          .max;
    });
    return max;
  }

  afterEach(() => {
    if (original === undefined) {
      delete process.env.ECOMMERCE_ORDER_LINE_MAX_QUANTITY;
    } else {
      process.env.ECOMMERCE_ORDER_LINE_MAX_QUANTITY = original;
    }
  });

  it.each([undefined, "", "  "])(
    "defaults to one million when unset or blank (%p)",
    (value) => {
      expect(readMaximum(value)).toBe(1_000_000);
    },
  );
  it.each(["1", "7", "2000000", "2147483647"])(
    "accepts the configured integer %s",
    (value) => {
      expect(readMaximum(value)).toBe(Number(value));
    },
  );
  it.each(["0", "-1", "1.5", "invalid", "2147483648"])(
    "reports an invalid configuration for %s",
    (value) => {
      expect(() => readMaximum(value)).toThrow(
        "Configuration error. ECOMMERCE_ORDER_LINE_MAX_QUANTITY",
      );
    },
  );
});

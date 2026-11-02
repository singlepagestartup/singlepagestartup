/**
 * BDD Suite: Query Builder | Filters.
 *
 * Given: a drizzle pg table with text, integer, uuid and jsonb columns.
 * When: filter descriptors are compiled into SQL predicates.
 * Then: every request-supplied segment is allow-listed or bound as a parameter.
 */

import { SQL, getOperators } from "drizzle-orm";
import * as pgCore from "drizzle-orm/pg-core";
import {
  ALLOWED_FILTER_METHODS,
  IAllowedFilterMethod,
  MAX_FILTERS,
  MAX_JSON_KEY_LENGTH,
  queryBuilder,
} from "./filters";

const Table = pgCore.pgTable("sl_profile", {
  id: pgCore.uuid("id").primaryKey().defaultRandom(),
  slug: pgCore.text("slug"),
  orderIndex: pgCore.integer("order_index"),
  title: pgCore.jsonb("title"),
});

const dialect = new pgCore.PgDialect();

function compile(filters: any) {
  return queryBuilder({
    table: Table,
    queryFunctions: getOperators(),
    filters,
  });
}

function compileOne(filter: any) {
  const predicates = compile({ and: [filter] });

  expect(predicates).toHaveLength(1);

  return dialect.sqlToQuery(predicates?.[0] as SQL);
}

/**
 * `not` is the one operator drizzle exposes with a single argument, so the
 * filter value never reaches the statement and the parameter list stays empty.
 */
const plainColumnCases: {
  method: IAllowedFilterMethod;
  value?: any;
  sql: string;
  params: any[];
}[] = [
  { method: "eq", value: "x", sql: '"sl_profile"."slug" = $1', params: ["x"] },
  { method: "ne", value: "x", sql: '"sl_profile"."slug" <> $1', params: ["x"] },
  { method: "not", value: "x", sql: 'not "sl_profile"."slug"', params: [] },
  { method: "gt", value: "x", sql: '"sl_profile"."slug" > $1', params: ["x"] },
  {
    method: "gte",
    value: "x",
    sql: '"sl_profile"."slug" >= $1',
    params: ["x"],
  },
  { method: "lt", value: "x", sql: '"sl_profile"."slug" < $1', params: ["x"] },
  {
    method: "lte",
    value: "x",
    sql: '"sl_profile"."slug" <= $1',
    params: ["x"],
  },
  {
    method: "like",
    value: "x",
    sql: 'CAST("sl_profile"."slug" AS TEXT) like $1',
    params: ["%x%"],
  },
  {
    method: "ilike",
    value: "x",
    sql: 'CAST("sl_profile"."slug" AS TEXT) ilike $1',
    params: ["%x%"],
  },
  {
    method: "notLike",
    value: "x",
    sql: 'CAST("sl_profile"."slug" AS TEXT) not like $1',
    params: ["%x%"],
  },
  {
    method: "notIlike",
    value: "x",
    sql: 'CAST("sl_profile"."slug" AS TEXT) not ilike $1',
    params: ["%x%"],
  },
  {
    method: "inArray",
    value: ["a", "b"],
    sql: '"sl_profile"."slug" in ($1, $2)',
    params: ["a", "b"],
  },
  {
    method: "notInArray",
    value: ["a", "b"],
    sql: '"sl_profile"."slug" not in ($1, $2)',
    params: ["a", "b"],
  },
  {
    method: "isNull",
    sql: '"sl_profile"."slug" is null',
    params: [],
  },
  {
    method: "isNotNull",
    sql: '"sl_profile"."slug" is not null',
    params: [],
  },
];

describe("Query Builder | Filters", () => {
  /**
   * BDD Scenario: allow-listed comparison methods.
   *
   * Given: a filter on a plain text column for one handled comparison method.
   * When: the builder compiles the filter.
   * Then: it renders the expected statement and carries the value as a parameter.
   */
  it.each(plainColumnCases)(
    "compiles the $method method and binds its value",
    ({ method, value, sql, params }) => {
      const query = compileOne({ column: "slug", method, value });

      expect(query.sql).toBe(sql);
      expect(query.params).toEqual(params);
    },
  );

  /**
   * BDD Scenario: the case table covers the whole allow list.
   *
   * Given: the exported allow list of filter methods.
   * When: it is compared with the compiled method cases above.
   * Then: every allowed method has a compiled case, so none is left untested.
   */
  it("covers every allow-listed method with a compiled case", () => {
    expect(
      plainColumnCases.map((filterCase) => filterCase.method).sort(),
    ).toEqual([...ALLOWED_FILTER_METHODS].sort());
  });

  /**
   * BDD Scenario: values never reach the statement text.
   *
   * Given: eq, ilike and inArray filters on a plain text column.
   * When: the builder compiles them.
   * Then: the searched value appears only in the parameter list.
   */
  it("keeps filter values out of the statement text for plain columns", () => {
    const eq = compileOne({ column: "slug", method: "eq", value: "secret" });
    const ilike = compileOne({
      column: "slug",
      method: "ilike",
      value: "secret",
    });
    const inArray = compileOne({
      column: "slug",
      method: "inArray",
      value: ["secret"],
    });

    expect(eq.sql).not.toContain("secret");
    expect(ilike.sql).not.toContain("secret");
    expect(inArray.sql).not.toContain("secret");
    expect(eq.params).toEqual(["secret"]);
    expect(ilike.params).toEqual(["%secret%"]);
    expect(inArray.params).toEqual(["secret"]);
  });

  /**
   * BDD Scenario: json key binding.
   *
   * Given: a jsonb column and a filter whose column is "title->>en".
   * When: the builder compiles the filter.
   * Then: the key is a bound parameter and no quoted key is spliced into the statement.
   */
  it("binds the json key as a parameter instead of statement text", () => {
    const query = compileOne({
      column: "title->>en",
      method: "eq",
      value: "x",
    });

    expect(query.sql).toBe('"sl_profile"."title"->>$1::text = $2');
    expect(query.params).toEqual(["en", "x"]);
    expect(query.sql).not.toContain("'en'");
  });

  /**
   * BDD Scenario: json key binding on every json-path branch.
   *
   * Given: json-path filters for the array, pattern and null branches.
   * When: the builder compiles them.
   * Then: each branch places the key first in the parameter list.
   */
  it("binds the json key on the array, pattern and null branches", () => {
    const inArray = compileOne({
      column: "title->>en",
      method: "inArray",
      value: ["a"],
    });
    const ilike = compileOne({
      column: "title->>en",
      method: "ilike",
      value: "x",
    });
    const isNull = compileOne({ column: "title->>en", method: "isNull" });
    const emptyInArray = compileOne({
      column: "title->>en",
      method: "inArray",
      value: undefined,
    });

    expect(inArray.sql).toBe('"sl_profile"."title"->>$1::text in ($2)');
    expect(inArray.params).toEqual(["en", "a"]);
    expect(ilike.sql).toBe('("sl_profile"."title"->>$1::text)::text ilike $2');
    expect(ilike.params).toEqual(["en", "%x%"]);
    expect(isNull.sql).toBe('"sl_profile"."title"->>$1::text is null');
    expect(isNull.params).toEqual(["en"]);
    expect(emptyInArray.sql).toBe('"sl_profile"."title"->>$1::text is null');
    expect(emptyInArray.params).toEqual(["en"]);
  });

  /**
   * BDD Scenario: hyphenated locale key.
   *
   * Given: a filter column of "title->>en-US".
   * When: the builder compiles the filter.
   * Then: a predicate is produced and the key is a bound parameter.
   */
  it("accepts a hyphenated locale key", () => {
    const query = compileOne({
      column: "title->>en-US",
      method: "eq",
      value: "x",
    });

    expect(query.sql).toBe('"sl_profile"."title"->>$1::text = $2');
    expect(query.params).toEqual(["en-US", "x"]);
  });

  /**
   * BDD Scenario: json key outside the identifier allow list.
   *
   * Given: a filter whose json key segment contains a character outside the allow list.
   * When: the builder compiles the filter.
   * Then: it throws a validation error and builds nothing.
   */
  it("rejects a json key that is not a plain identifier", () => {
    expect(() => {
      compile({ and: [{ column: "title->>en US", method: "eq", value: "x" }] });
    }).toThrow(/^Validation error\./);
  });

  /**
   * BDD Scenario: json key length bound.
   *
   * Given: a filter whose json key is one character longer than the maximum.
   * When: the builder compiles the filter.
   * Then: it throws a validation error naming the maximum.
   */
  it("rejects a json key longer than the allowed maximum", () => {
    const key = "a".repeat(MAX_JSON_KEY_LENGTH + 1);

    expect(() => {
      compile({
        and: [{ column: `title->>${key}`, method: "eq", value: "x" }],
      });
    }).toThrow(
      `Validation error. Json key is longer than ${MAX_JSON_KEY_LENGTH} characters`,
    );
  });

  /**
   * BDD Scenario: a single json key per column.
   *
   * Given: a filter column carrying two json path separators.
   * When: the builder compiles the filter.
   * Then: it throws a validation error instead of discarding the trailing segment.
   */
  it("rejects a column with more than one json path separator", () => {
    expect(() => {
      compile({
        and: [{ column: "title->>en->>ru", method: "eq", value: "x" }],
      });
    }).toThrow(/^Validation error\./);
  });

  /**
   * BDD Scenario: unhandled comparison method.
   *
   * Given: a filter whose method is outside the handled set.
   * When: the builder compiles the filter.
   * Then: it throws a validation error instead of silently producing no predicate.
   */
  it("rejects an unknown filter method", () => {
    expect(() => {
      compile({ and: [{ column: "slug", method: "between", value: "x" }] });
    }).toThrow("Validation error. Unknown filter method 'between'");
  });

  /**
   * BDD Scenario: method taken from the prototype chain.
   *
   * Given: a filter whose method names an inherited object property.
   * When: the builder compiles the filter.
   * Then: it throws a validation error, so prototype keys cannot pass as methods.
   */
  it("rejects a filter method inherited from the object prototype", () => {
    expect(() => {
      compile({
        and: [{ column: "slug", method: "constructor", value: "x" }],
      });
    }).toThrow(/^Validation error\./);
  });

  /**
   * BDD Scenario: malformed column.
   *
   * Given: a filter object with a method but no column.
   * When: the builder compiles the filter.
   * Then: it throws a validation error rather than a TypeError.
   */
  it("rejects a filter without a column", () => {
    expect(() => {
      compile({ and: [{ method: "eq", value: "x" }] });
    }).toThrow("Validation error. Missing 'column' in filter object");
    expect(() => {
      compile({ and: [{ method: "eq", value: "x" }] });
    }).not.toThrow(TypeError);
  });

  /**
   * BDD Scenario: unknown json base column.
   *
   * Given: a json-path filter whose base segment is not a table column.
   * When: the builder compiles the filter.
   * Then: the message begins with "Validation error." so the API answers 400.
   */
  it("reports an unknown json base column as a validation error", () => {
    expect(() => {
      compile({ and: [{ column: "absent->>en", method: "eq", value: "x" }] });
    }).toThrow("Validation error. Unknown column 'absent'");
  });

  /**
   * BDD Scenario: filter group shape.
   *
   * Given: filters.and supplied as an object.
   * When: the builder compiles the filters.
   * Then: it throws a validation error rather than a TypeError.
   */
  it("rejects a filter group that is not an array", () => {
    expect(() => {
      compile({ and: {} });
    }).toThrow("Validation error. 'filters.and' must be an array");
    expect(() => {
      compile({ and: {} });
    }).not.toThrow(TypeError);
  });

  /**
   * BDD Scenario: filter count bound.
   *
   * Given: one filter more than the maximum the builder accepts.
   * When: the builder compiles the filters.
   * Then: it throws a validation error naming the maximum.
   */
  it("rejects more filters than the allowed maximum", () => {
    const and = new Array(MAX_FILTERS + 1).fill({
      column: "slug",
      method: "eq",
      value: "x",
    });

    expect(() => {
      compile({ and });
    }).toThrow(`Validation error. Too many filters, maximum is ${MAX_FILTERS}`);
  });

  /**
   * BDD Scenario: no filters at all.
   *
   * Given: an empty filter group.
   * When: the builder compiles the filters.
   * Then: it returns no predicates instead of refusing the request.
   */
  it("returns no predicates for an empty filter group", () => {
    expect(compile({ and: [] })).toEqual([]);
    expect(compile(undefined)).toBeUndefined();
  });
});

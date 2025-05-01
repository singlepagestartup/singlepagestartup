import { Field } from "./Coder";

describe("Coder", () => {
  describe(`Field regex pattern`, () => {
    const name = "class_name";
    const pgCoreType = "text";
    const isRequired = true;
    const field = new Field({ name, pgCoreType, isRequired });

    it(`should match the regex 1`, () => {
      const regex = field.onRemove.regex;

      const string = `export const fields = {
        className: pgCore.text("class_name").notNull(),
        id: pgCore.uuid("id").primaryKey().defaultRandom(),
        title: pgCore.text("title").notNull().default("Page"),`;

      expect(string).toMatch(regex);
    });

    it(`should match the regex 2`, () => {
      const regex = field.onCreate.regex;

      const string = `export const fields = {
        id: pgCore.uuid("id").primaryKey().defaultRandom(),
        title: pgCore.text("title").notNull().default("Page"),`;

      expect(string).toMatch(regex);
    });
  });
});

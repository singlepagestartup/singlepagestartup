/**
 * BDD Suite: Change-log shapes in a workspace document
 * Given a document must state what is in force rather than how it got there
 * When its body is inspected
 * Then every date inside a statement and every contrast with an earlier edition is reported
 */

import { describe, expect, test } from "bun:test";

import { findChangeLogShapes } from "./change-log";

describe("change-log shapes", () => {
  /**
   * BDD Scenario: A review date narrated inside a sentence
   * Given a paragraph that names when a review happened
   * When the body is inspected
   * Then the date is reported with the line that carries it
   */
  test("reports a date that sits inside a statement", () => {
    const findings = findChangeLogShapes(
      "Доступ действует 183 дня.\nПовторный просмотр 2026-09-19 добавил словарь.\n",
    );

    expect(findings).toHaveLength(1);
    expect(findings[0].match).toBe("2026-09-19");
    expect(findings[0].line).toBe(2);
    expect(findings[0].detail).toContain("attribution");
  });

  /**
   * BDD Scenario: A date in a table column that exists to carry attribution
   * Given a table row whose source column names the day an input was supplied
   * When the body is inspected
   * Then the date is left alone because the column is the attribution
   */
  test("leaves a date inside a table row alone", () => {
    expect(
      findChangeLogShapes(
        "| Роль | Источник |\n| ---- | -------- |\n| Текст | уточнение оператора, 2026-09-08 |\n",
      ),
    ).toEqual([]);
  });

  /**
   * BDD Scenario: An obsolete statement kept beside the one in force
   * Given prose that contrasts a previous edition with the current rule
   * When the body is inspected
   * Then each contrast is reported in both languages the workspace uses
   */
  test("reports wording that contrasts an earlier edition", () => {
    const findings = findChangeLogShapes(
      "Прежний набор нёс словарь фреймворка.\nThe previously selected font is replaced.\n| Ключ | illustration-ref-06; прежний пример |\n",
    );

    expect(findings.map(({ match }) => match.toLocaleLowerCase())).toEqual([
      "прежний",
      "previously",
      "прежний",
    ]);
    expect(findings.map(({ line }) => line)).toEqual([1, 2, 3]);
  });

  /**
   * BDD Scenario: Dates that are identifiers, paths or commented-out notes
   * Given a body whose dates live in code, a link target and an HTML comment
   * When it is inspected
   * Then nothing is reported because none of them is a statement
   */
  test("ignores dates in code, link targets and comments", () => {
    expect(
      findChangeLogShapes(
        "Файл `review-2026-09-02.png` зарегистрирован.\n" +
          "Смотри [снимок](/assets/startup/2026-09-02/cover.png).\n" +
          "<!-- 2026-09-19 -->\n" +
          "```\nПовторный просмотр 2026-09-19\n```\n",
      ),
    ).toEqual([]);
  });

  /**
   * BDD Scenario: A document that only states what is in force
   * Given a body without a date in prose and without a contrast
   * When it is inspected
   * Then no finding is produced
   */
  test("reports nothing for a body that states only what is in force", () => {
    expect(
      findChangeLogShapes(
        "Доступ к выбранной версии действует 183 дня с оплаты.\nОриентир отмечает выбор и прогресс.\n",
      ),
    ).toEqual([]);
  });
});

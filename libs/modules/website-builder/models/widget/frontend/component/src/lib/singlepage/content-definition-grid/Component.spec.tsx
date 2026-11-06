import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentType } from "react";

interface IViewCase {
  variant: string;
  View: ComponentType<any>;
}

const mockFeatureQueries = jest.fn();
const mockFeatureRows = jest.fn();
const mockLinks = [
  { id: "saved-second", widgetId: "saved-widget", orderIndex: 2 },
  { id: "saved-first", widgetId: "saved-widget", orderIndex: 1 },
];

jest.mock("@sps/shared-ui-shadcn", () => ({
  TipTap: ({ value }: { value: string }) => <p>{value}</p>,
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...values: unknown[]) => values.filter(Boolean).join(" "),
}));
jest.mock(
  "@sps/website-builder/relations/widgets-to-features/frontend/component",
  () => ({
    Component: (props: any) => {
      if (props.variant === "find") {
        mockFeatureQueries(props.apiProps);
        return props.children({ data: mockLinks });
      }
      mockFeatureRows(props);
      return <article data-saved-feature={props.data.id} />;
    },
  }),
);
jest.mock(
  "@sps/website-builder/relations/widgets-to-buttons-arrays/frontend/component",
  () => ({ Component: (props: any) => props.children({ data: [] }) }),
);
jest.mock(
  "@sps/website-builder/relations/widgets-to-file-storage-module-files/frontend/component",
  () => ({ Component: (props: any) => props.children({ data: [] }) }),
);

import { Component as Split } from "../content-feature-split/Component";
import { Component as SplitReverse } from "../content-feature-split-reverse/Component";
import { Component as Grid } from "./Component";
import { Component as GridPage } from "../content-definition-grid-page/Component";
import { Component as Steps } from "../content-steps/Component";
import { Component as Offer } from "../content-offer/Component";
import { Component as OfferCard } from "../content-offer-card/Component";
import { Component as Faq } from "../content-faq/Component";

const views: IViewCase[] = [
  { variant: "content-feature-split", View: Split },
  { variant: "content-feature-split-reverse", View: SplitReverse },
  { variant: "content-definition-grid", View: Grid },
  { variant: "content-definition-grid-page", View: GridPage },
  { variant: "content-steps", View: Steps },
  { variant: "content-offer", View: Offer },
  { variant: "content-offer-card", View: OfferCard },
  { variant: "content-faq", View: Faq },
];

function OpaqueHostChild() {
  return null;
}

beforeEach(() => {
  mockFeatureQueries.mockClear();
  mockFeatureRows.mockClear();
});

describe.each(views)(
  "$variant saved Feature composition",
  ({ variant, View }) => {
    it.each(["opaque", "visible"])(
      "keeps ordered saved Features alongside a %s child slot",
      (slot) => {
        const html = renderToStaticMarkup(
          <View
            isServer={true}
            variant={variant}
            language="en"
            data={{ id: "saved-widget", title: { en: "Saved heading" } }}
          >
            {slot === "opaque" ? (
              <OpaqueHostChild />
            ) : (
              <aside data-domain-slot="visible">Domain content</aside>
            )}
          </View>,
        );

        expect(html).toContain('data-saved-feature="saved-first"');
        expect(html).toContain('data-saved-feature="saved-second"');
        expect(html.indexOf("saved-first")).toBeLessThan(
          html.indexOf("saved-second"),
        );
        expect(mockFeatureQueries).toHaveBeenCalledTimes(1);
        expect(mockFeatureQueries).toHaveBeenCalledWith({
          params: {
            filters: {
              and: [
                { column: "widgetId", method: "eq", value: "saved-widget" },
              ],
            },
          },
        });
        expect(mockFeatureRows.mock.calls.map(([row]) => row.data.id)).toEqual([
          "saved-first",
          "saved-second",
        ]);
        for (const [row] of mockFeatureRows.mock.calls) {
          expect(row).toEqual(
            expect.objectContaining({
              variant: "default",
              dataSource: "props",
              isServer: true,
              language: "en",
            }),
          );
        }
        if (slot === "visible") {
          expect(html).toContain('data-domain-slot="visible"');
        }
      },
    );
  },
);

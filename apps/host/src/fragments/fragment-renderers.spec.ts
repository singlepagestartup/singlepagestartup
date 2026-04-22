/**
 * BDD Suite: component fragment route helpers.
 *
 * Given: module apps expose frontend component routes instead of JSON render APIs.
 * When: host builds remote fragment URLs and receives module route HTML.
 * Then: host can address targets generically and extract only the fragment root.
 */

import { extractFragmentRootHtml } from "@sps/shared-fragments";

import { componentFragmentUrl } from "./remote";

describe("component fragment route helpers", () => {
  /**
   * BDD Scenario: host builds a module component route URL.
   *
   * Given: an ecommerce external widget relation is rendered by host.
   * When: the host addresses the remote widget component route.
   * Then: the URL contains only the target path and serialized render context.
   */
  it("builds component fragment route URLs", () => {
    const url = componentFragmentUrl({
      module: "ecommerce",
      target: {
        kind: "model",
        name: "widget",
        variant: "default",
      },
      searchParams: {
        contextUrl: "/ecommerce/products/pro",
        externalWidgetId: "widget-1",
        language: "en",
        recipe: "ecommerce-product-actions",
      },
    });

    expect(url).toContain(
      "http://localhost:3010/sps/fragments/model/widget/default",
    );
    expect(url).toContain("externalWidgetId=widget-1");
    expect(url).toContain("recipe=ecommerce-product-actions");
  });

  /**
   * BDD Scenario: host extracts the component fragment root.
   *
   * Given: a module app returns a full App Router HTML document.
   * When: the host receives the HTML response.
   * Then: only the data-sps-fragment-root inner HTML is inserted into the host page.
   */
  it("extracts fragment root html from full route responses", () => {
    expect(
      extractFragmentRootHtml(`
        <html>
          <body>
            <main data-sps-fragment-root="">
              <section data-module="ecommerce">Rendered</section>
            </main>
            <script>self.__next_f=[]</script>
          </body>
        </html>
      `),
    ).toBe('<section data-module="ecommerce">Rendered</section>');
  });

  /**
   * BDD Scenario: host normalizes streamed fragment route HTML.
   *
   * Given: a module route streams Suspense content outside the root marker.
   * When: the host extracts the fragment root.
   * Then: known React stream replacements are applied before insertion.
   */
  it("applies streamed segment replacements before extracting root html", () => {
    expect(
      extractFragmentRootHtml(`
        <html>
          <body>
            <main data-sps-fragment-root>
              <section><!--$?--><template id="B:0"></template><!--/$--></section>
            </main>
            <div hidden id="S:0"><article data-module="ecommerce">Loaded</article></div><script>$RC("B:0","S:0")</script>
          </body>
        </html>
      `),
    ).toBe(
      '<section><article data-module="ecommerce">Loaded</article></section>',
    );
  });
});

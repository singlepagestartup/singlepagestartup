/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: analytics link.
 *
 * Given: a link can receive one or more analytics events.
 * When: the link is clicked before navigation.
 * Then: each analytics event is tracked and the original click handler still runs.
 */

import { act } from "react";
import { AnalyticsLink } from "./Component";
import {
  cleanupHarness,
  createDomHarness,
  enableReactActEnvironment,
  renderInHarness,
  TDomHarness,
} from "../admin-v2/test-utils/dom-harness";

const mockTrackAnalyticsEvent = jest.fn();

jest.mock("@sps/shared-frontend-client-utils", () => ({
  trackAnalyticsEvent: (...args: unknown[]) => mockTrackAnalyticsEvent(...args),
}));

jest.mock("next/link", () => {
  const React = jest.requireActual("react");

  return {
    __esModule: true,
    default: React.forwardRef(({ href, children, ...props }: any, ref: any) => (
      <a
        href={typeof href === "string" ? href : String(href)}
        ref={ref}
        {...props}
      >
        {children}
      </a>
    )),
  };
});

describe("GIVEN: analytics link", () => {
  let harness: TDomHarness;

  beforeEach(() => {
    mockTrackAnalyticsEvent.mockClear();
    harness = createDomHarness();
  });

  afterEach(() => {
    cleanupHarness(harness);
  });

  /**
   * BDD Scenario: tracks a single analytics event.
   *
   * Given: a link receives one analytics event.
   * When: the link is clicked.
   * Then: the event is tracked before the consumer click handler runs.
   */
  it("WHEN clicked with one analytics event THEN tracks the event and calls onClick", () => {
    const onClick = jest.fn();

    renderInHarness(
      harness,
      <AnalyticsLink
        href="/target"
        analytics={{
          name: "website_builder_button_click",
          metadata: {
            id: "button-id",
          },
        }}
        onClick={onClick}
      >
        Target
      </AnalyticsLink>,
    );

    const link = harness.container.querySelector("a");

    act(() => {
      link?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });

    expect(mockTrackAnalyticsEvent).toHaveBeenCalledWith({
      name: "website_builder_button_click",
      metadata: {
        id: "button-id",
      },
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  /**
   * BDD Scenario: tracks multiple analytics events.
   *
   * Given: a link receives shared and id-specific analytics events.
   * When: the link is clicked.
   * Then: both events are tracked in the provided order.
   */
  it("WHEN clicked with multiple analytics events THEN tracks each event in order", () => {
    renderInHarness(
      harness,
      <AnalyticsLink
        href="/target"
        analytics={[
          {
            name: "website_builder_button_click",
            metadata: {
              id: "button-id",
            },
          },
          {
            name: "website_builder_button_click_button-id",
            metadata: {
              id: "button-id",
            },
          },
        ]}
      >
        Target
      </AnalyticsLink>,
    );

    const link = harness.container.querySelector("a");

    act(() => {
      link?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });

    expect(mockTrackAnalyticsEvent).toHaveBeenNthCalledWith(1, {
      name: "website_builder_button_click",
      metadata: {
        id: "button-id",
      },
    });
    expect(mockTrackAnalyticsEvent).toHaveBeenNthCalledWith(2, {
      name: "website_builder_button_click_button-id",
      metadata: {
        id: "button-id",
      },
    });
  });
});

beforeAll(() => {
  enableReactActEnvironment();
});

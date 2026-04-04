/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: admin-v2 select-input client component.
 *
 * Given: suite fixtures and test doubles are prepared for deterministic behavior.
 * When: a scenario action from this suite is executed.
 * Then: assertions verify expected observable behavior and contracts.
 */

import { act } from "react";
import { Component } from "./ClientComponent";
import {
  cleanupHarness,
  createDomHarness,
  enableReactActEnvironment,
  renderInHarness,
  TDomHarness,
} from "../test-utils/dom-harness";

type TAttributeOption = {
  id: string;
  adminTitle?: string;
};

const formFieldSpy = jest.fn();
const useWatchMock = jest.fn();

jest.mock("@sps/ui-adapter", () => ({
  FormField: (props: any) => {
    formFieldSpy(props);
    return <div data-testid="form-field" />;
  },
}));

jest.mock("react-hook-form", () => ({
  useWatch: (props: any) => useWatchMock(props),
}));

describe("GIVEN: admin-v2 select-input client component", () => {
  let harness: TDomHarness;

  beforeEach(() => {
    harness = createDomHarness();
    formFieldSpy.mockReset();
    useWatchMock.mockReset();
    useWatchMock.mockReturnValue("");
  });

  afterEach(() => {
    cleanupHarness(harness);
    jest.useRealTimers();
  });

  it("WHEN container props are passed THEN loader branch fetches data and forwards merged results to child", () => {
    let callIndex = 0;
    const find = jest.fn(() => {
      callIndex += 1;

      if (callIndex % 2 === 1) {
        return {
          data: [{ id: "option-1", adminTitle: "Option One" }],
          isLoading: false,
          isFetching: false,
        };
      }

      return {
        data: [],
        isLoading: false,
        isFetching: false,
      };
    });
    const findById = jest.fn().mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
    });
    const childSpy = jest.fn((props: any) => (
      <div data-testid="child-count">{props.data.length}</div>
    ));

    renderInHarness(
      harness,
      <Component<TAttributeOption, "admin-v2-select-input">
        isServer={false}
        variant="admin-v2-select-input"
        module="ecommerce"
        name="attribute"
        formFieldName="attributeId"
        form={{ control: {} } as any}
        renderField="adminTitle"
        api={{ find, findById } as any}
        Component={childSpy as any}
      />,
    );

    expect(find.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(childSpy).toHaveBeenCalled();
    expect(childSpy.mock.calls[0]?.[0]?.data).toEqual([
      { id: "option-1", adminTitle: "Option One" },
    ]);
    expect(
      harness.container.querySelector('[data-testid="child-count"]')
        ?.textContent,
    ).toBe("1");
  });

  it("WHEN view props are passed THEN FormField receives mapped options with renderFunction precedence", () => {
    renderInHarness(
      harness,
      <Component<TAttributeOption, "admin-v2-select-input">
        isServer={false}
        variant="admin-v2-select-input"
        module="ecommerce"
        name="attribute"
        type="model"
        formFieldName="attributeId"
        form={{ control: {} } as any}
        renderField="adminTitle"
        renderFunction={(entity: any) => `preview-${entity.id}`}
        data={[{ id: "a-1", adminTitle: "Primary" }, { id: "a-2" }]}
      />,
    );

    expect(formFieldSpy).toHaveBeenCalled();
    const fieldProps = formFieldSpy.mock.calls[0]?.[0];
    expect(fieldProps.name).toBe("attributeId");
    expect(fieldProps.placeholder).toBe("Select attribute");
    expect(fieldProps.options).toEqual([
      ["a-1", "Primary", "preview-a-1"],
      ["a-2", "a-2"],
    ]);
  });

  it("WHEN selected id is outside current search result THEN selected entity is merged into forwarded data", () => {
    useWatchMock.mockReturnValue("selected-1");

    let callIndex = 0;
    const find = jest.fn(() => {
      callIndex += 1;

      if (callIndex % 2 === 1) {
        return {
          data: [{ id: "search-1", adminTitle: "Search Result" }],
          isLoading: false,
          isFetching: false,
        };
      }

      return {
        data: [],
        isLoading: false,
        isFetching: false,
      };
    });
    const findById = jest.fn().mockReturnValue({
      data: { id: "selected-1", adminTitle: "Selected Entity" },
      isLoading: false,
      isFetching: false,
    });
    const childSpy = jest.fn((_props: any) => (
      <div data-testid="merged-data" />
    ));

    renderInHarness(
      harness,
      <Component<TAttributeOption, "admin-v2-select-input">
        isServer={false}
        variant="admin-v2-select-input"
        module="ecommerce"
        name="attribute"
        formFieldName="attributeId"
        form={{ control: {} } as any}
        renderField="adminTitle"
        api={{ find, findById } as any}
        Component={childSpy as any}
      />,
    );

    expect(findById).toHaveBeenCalledWith({
      id: "selected-1",
      reactQueryOptions: {
        enabled: true,
      },
    });

    expect(childSpy).toHaveBeenCalled();
    expect(childSpy.mock.calls[0]?.[0]?.data).toEqual(
      expect.arrayContaining([
        { id: "search-1", adminTitle: "Search Result" },
        { id: "selected-1", adminTitle: "Selected Entity" },
      ]),
    );
  });

  it("WHEN search text is entered with searchById enabled THEN main and id-fallback queries are built", () => {
    jest.useFakeTimers();

    const find = jest.fn().mockReturnValue({
      data: [],
      isLoading: false,
      isFetching: false,
    });
    const findById = jest.fn().mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
    });
    let latestProps: any;

    renderInHarness(
      harness,
      <Component<TAttributeOption, "admin-v2-select-input">
        isServer={false}
        variant="admin-v2-select-input"
        module="ecommerce"
        name="attribute"
        formFieldName="attributeId"
        form={{ control: {} } as any}
        renderField="adminTitle"
        searchField="adminTitle"
        searchById={true}
        api={{ find, findById } as any}
        Component={(props: any) => {
          latestProps = props;
          return <div data-testid="search-child" />;
        }}
      />,
    );

    act(() => {
      latestProps.onSearchValueChange("desk");
    });

    act(() => {
      jest.advanceTimersByTime(350);
    });

    const queryCalls = find.mock.calls.map((call) => call[0]);

    const mainSearchCall = queryCalls.find((args) =>
      args?.params?.filters?.and?.some(
        (filter: any) =>
          filter.column === "adminTitle" && filter.value === "desk",
      ),
    );
    const idFallbackCall = queryCalls.find(
      (args) =>
        args?.params?.filters?.and?.some(
          (filter: any) => filter.column === "id" && filter.value === "desk",
        ) && args?.reactQueryOptions?.enabled === true,
    );

    expect(mainSearchCall).toBeTruthy();
    expect(idFallbackCall).toBeTruthy();
  });

  it("WHEN initial request is loading without data THEN skeleton fallback is rendered", () => {
    let callIndex = 0;
    const find = jest.fn(() => {
      callIndex += 1;

      if (callIndex % 2 === 1) {
        return {
          data: undefined,
          isLoading: true,
          isFetching: true,
        };
      }

      return {
        data: [],
        isLoading: false,
        isFetching: false,
      };
    });
    const findById = jest.fn().mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
    });

    renderInHarness(
      harness,
      <Component<TAttributeOption, "admin-v2-select-input">
        isServer={false}
        variant="admin-v2-select-input"
        module="ecommerce"
        name="attribute"
        formFieldName="attributeId"
        form={{ control: {} } as any}
        renderField="adminTitle"
        api={{ find, findById } as any}
        Skeleton={<div data-testid="select-skeleton">loading</div>}
        Component={() => <div data-testid="child">child</div>}
      />,
    );

    expect(
      harness.container.querySelector('[data-testid="select-skeleton"]')
        ?.textContent,
    ).toBe("loading");
  });
});

beforeAll(() => {
  enableReactActEnvironment();
});

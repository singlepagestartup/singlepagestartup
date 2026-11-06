import { renderToStaticMarkup } from "react-dom/server";
import { Component } from "./ClientComponent";
const mockRead = jest.fn();
const mockSubject = jest.fn();
jest.mock(
  "@sps/rbac/relations/widgets-to-website-builder-module-widgets/frontend/component",
  () => ({
    Component: (props: any) => {
      mockRead("frames", props);
      return props.variant === "find" ? (
        props.children({
          data: [
            { id: "frame-link", websiteBuilderModuleWidgetId: "contact-frame" },
          ],
        })
      ) : (
        <div data-frame={props.data.websiteBuilderModuleWidgetId}>
          {props.children}
        </div>
      );
    },
  }),
);
jest.mock(
  "@sps/rbac/relations/widgets-to-crm-module-widgets/frontend/component",
  () => ({
    Component: (props: any) => {
      mockRead("crm-links", props);
      return props.children({
        data: [{ id: "crm-link", crmModuleWidgetId: "exact-crm-widget" }],
      });
    },
  }),
);
jest.mock("@sps/crm/relations/widgets-to-forms/frontend/component", () => ({
  Component: (props: any) => {
    mockRead("forms-links", props);
    return props.children({ data: [{ id: "form-link", formId: "real-form" }] });
  },
}));
jest.mock("@sps/crm/models/form/frontend/component", () => ({
  Component: (props: any) => {
    mockRead("form", props);
    return props.children({
      data: [{ id: "real-form", title: { en: "Contact" } }],
    });
  },
}));
jest.mock("@sps/rbac/models/subject/frontend/component", () => ({
  Component: (props: any) => {
    mockSubject(props);
    return <div>Actual Subject request operation</div>;
  },
}));
it("uses exact saved WB/CRM/Form links and supplies the unchanged real form to the current-Subject operation", () => {
  const html = renderToStaticMarkup(
    <Component
      isServer={false}
      variant="subject-me-crm-module-form-request-create"
      language="en"
      data={{ id: "rbac-contact" } as any}
    />,
  );
  expect(html).toContain('data-frame="contact-frame"');
  expect(html).toContain("Actual Subject request operation");
  expect(mockRead).toHaveBeenCalledWith(
    "frames",
    expect.objectContaining({
      variant: "find",
      apiProps: {
        params: {
          filters: {
            and: [{ column: "widgetId", method: "eq", value: "rbac-contact" }],
          },
        },
      },
    }),
  );
  expect(mockRead).toHaveBeenCalledWith(
    "forms-links",
    expect.objectContaining({
      apiProps: {
        params: {
          filters: {
            and: [
              { column: "widgetId", method: "eq", value: "exact-crm-widget" },
            ],
          },
          orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
        },
      },
    }),
  );
  expect(mockSubject).toHaveBeenCalledWith(
    expect.objectContaining({
      isServer: false,
      variant: "me-crm-module-form-request-create",
      crmModuleForm: { id: "real-form", title: { en: "Contact" } },
    }),
  );
});

import { renderToStaticMarkup } from "react-dom/server";
const mockLinks = [
  { id: "second-link", orderIndex: 1, fileStorageModuleFileId: "video" },
  { id: "first-link", orderIndex: 0, fileStorageModuleFileId: "image" },
];
const mockRelations = jest.fn();
const mockFiles = jest.fn();
jest.mock(
  "@sps/ecommerce/relations/products-to-file-storage-module-files/frontend/component",
  () => ({
    Component: (props: any) => {
      mockRelations(props);
      return props.children({ data: mockLinks });
    },
  }),
);
jest.mock("@sps/file-storage/models/file/frontend/component", () => ({
  Component: (props: any) => {
    mockFiles(props);
    return props.variant === "find" ? (
      props.children({
        data: [
          {
            id: "image",
            variant: "default",
            mimeType: "image/webp",
            file: "/photo.webp",
            alt: "Real photo",
          },
          {
            id: "video",
            variant: "default",
            mimeType: "video/mp4",
            file: "/demo.mp4",
            alt: "Real video",
          },
        ],
      })
    ) : (
      <span>{props.data.id}</span>
    );
  },
}));
jest.mock("./ClientComponent", () => ({
  Component: (props: any) => (
    <div>
      {props.items.map((item: any) => (
        <div key={item.id} data-testid={item.id}>
          {item.content}
        </div>
      ))}
    </div>
  ),
}));
import { Component } from "./Component";
it("loads every linked file once by exact IDs, keeps order and media types, and renders already loaded records", () => {
  const html = renderToStaticMarkup(
    <Component
      isServer={true}
      variant="gallery"
      dataSource="props"
      data={
        { id: "product", slug: "real-product", title: { en: "Product" } } as any
      }
      language="en"
      includeAllMedia
    />,
  );
  expect(html.indexOf("first-link")).toBeLessThan(html.indexOf("second-link"));
  expect(html).toContain("image");
  expect(html).toContain("video");
  const reads = mockFiles.mock.calls
    .map(([props]) => props)
    .filter((props) => props.variant === "find");
  expect(reads).toHaveLength(1);
  expect(reads[0].apiProps.params.filters.and).toEqual([
    { column: "id", method: "inArray", value: ["video", "image"] },
  ]);
  expect(mockFiles).toHaveBeenCalledWith(
    expect.objectContaining({
      variant: "default",
      dataSource: "props",
      data: expect.objectContaining({ id: "video" }),
    }),
  );
  expect(mockRelations.mock.calls[0][0].apiProps.params.filters.and).toEqual([
    { column: "productId", method: "eq", value: "product" },
  ]);
});

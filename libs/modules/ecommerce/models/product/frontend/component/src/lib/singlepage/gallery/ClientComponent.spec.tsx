/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { Component } from "./ClientComponent";
const items = [
  {
    id: "photo",
    label: "Photo",
    thumbnail: "/first.webp",
    content: <div>PHOTO-CONTENT</div>,
  },
  {
    id: "video",
    label: "Video",
    content: (
      <div>
        VIDEO-CONTENT
        <input aria-label="Media caption" />
      </div>
    ),
  },
  { id: "audio", label: "Audio", content: <div>AUDIO-CONTENT</div> },
];
it("switches every related media type with thumbnails and keyboard without intercepting text input", () => {
  render(
    <Component id="product" title="Product" language="en" items={items} />,
  );
  expect(screen.getByText("PHOTO-CONTENT")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Media 2: Video" }));
  expect(screen.queryByText("PHOTO-CONTENT")).toBeNull();
  expect(screen.getByText("VIDEO-CONTENT")).toBeTruthy();
  fireEvent.keyDown(screen.getByLabelText("Media caption"), {
    key: "ArrowRight",
  });
  expect(screen.getByText("VIDEO-CONTENT")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Next media" }));
  expect(screen.getByText("AUDIO-CONTENT")).toBeTruthy();
  fireEvent.keyDown(screen.getByText("AUDIO-CONTENT").parentElement!, {
    key: "Home",
  });
  expect(screen.getByText("PHOTO-CONTENT")).toBeTruthy();
});
it("recovers a removed selected record on refetch and handles empty/single media", () => {
  const view = render(
    <Component id="product" title="Product" language="en" items={items} />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Media 3: Audio" }));
  view.rerender(
    <Component id="product" title="Product" language="en" items={[items[0]]} />,
  );
  expect(screen.getByText("PHOTO-CONTENT")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Next media" })).toBeNull();
  view.rerender(
    <Component id="product" title="Product" language="en" items={[]} />,
  );
  expect(view.container.innerHTML).toBe("");
});

/** @jest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import { Component } from "./ClientComponent";

const mockCarousel = {
  selectedScrollSnap: jest.fn(() => 0),
  on: jest.fn(),
  off: jest.fn(),
  scrollPrev: jest.fn(),
  scrollNext: jest.fn(),
  scrollTo: jest.fn(),
};
jest.mock("embla-carousel-react", () => ({
  __esModule: true,
  default: () => [jest.fn(), mockCarousel],
}));
jest.mock("@sps/shared-frontend-client-utils", () => ({
  cn: (...values: any[]) => values.filter(Boolean).join(" "),
}));
const props = {
  data: { id: "gallery", title: { en: "Saved gallery" } },
  variant: "default",
  language: "en",
  slides: [
    { id: "a", content: <input aria-label="Caption" /> },
    { id: "b", content: <a href="/saved">Saved CTA</a> },
  ],
} as any;
beforeEach(() => jest.clearAllMocks());

it("keeps keyboard navigation outside editable fields and removes inactive content from focus", () => {
  const { container, unmount } = render(<Component {...props} />);
  const carousel = screen.getByRole("region", { name: "Saved gallery" });
  fireEvent.keyDown(screen.getByRole("textbox"), { key: "ArrowRight" });
  expect(mockCarousel.scrollNext).not.toHaveBeenCalled();
  fireEvent.keyDown(carousel, { key: "ArrowRight" });
  expect(mockCarousel.scrollNext).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(carousel, { key: "End" });
  expect(mockCarousel.scrollTo).toHaveBeenCalledWith(1);
  expect(container.querySelector('[aria-hidden="true"][inert]')).not.toBeNull();
  unmount();
  expect(mockCarousel.off).toHaveBeenCalledWith("select", expect.any(Function));
  expect(mockCarousel.off).toHaveBeenCalledWith("reInit", expect.any(Function));
});
it.each(["numbers", "dots"])(
  "uses one navigation system for %s",
  (navigation) => {
    render(<Component {...props} navigation={navigation} />);
    expect(screen.queryByRole("button", { name: "Next slide" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Slide 2" }));
    expect(mockCarousel.scrollTo).toHaveBeenCalledWith(1);
  },
);
it("does not expose redundant controls for empty or single galleries", () => {
  const { rerender } = render(<Component {...props} slides={[]} />);
  expect(screen.getByText("No slides yet.")).toBeTruthy();
  expect(screen.queryAllByRole("button")).toHaveLength(0);
  rerender(<Component {...props} slides={[props.slides[0]]} />);
  expect(screen.queryAllByRole("button")).toHaveLength(0);
  expect(screen.getByRole("textbox")).toBeTruthy();
});

it("preserves native media and range-control keyboard handling", () => {
  const { container } = render(
    <Component
      {...props}
      slides={[
        {
          id: "media",
          content: (
            <>
              <video controls aria-label="Saved video" />
              <audio controls aria-label="Saved audio" />
              <div role="slider" tabIndex={0} />
            </>
          ),
        },
        props.slides[1],
      ]}
    />,
  );
  for (const element of Array.from(
    container.querySelectorAll("video,audio,[role=slider]"),
  )) {
    const allowed = fireEvent.keyDown(element, { key: "ArrowRight" });
    expect(allowed).toBe(true);
  }
  expect(mockCarousel.scrollNext).not.toHaveBeenCalled();
});

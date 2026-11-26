/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Component } from "./ClientComponent";
const success = jest.fn();
jest.mock("sonner", () => ({
  toast: { success: (...args: unknown[]) => success(...args) },
}));
jest.mock("@sps/ui-adapter", () => ({ Icon: () => null }));

afterEach(() => {
  success.mockClear();
});

it("shows a success toast only after a successful save and keeps success out of the error area", async () => {
  const onSave = jest.fn().mockResolvedValue({});
  render(
    <Component
      language="en"
      isServer={false}
      variant="id-settings-ai-chat"
      data={{ id: "profile", title: { en: "Profile" }, slug: "profile" } as any}
      onSave={onSave}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  await waitFor(() =>
    expect(success).toHaveBeenCalledWith(
      "Profile saved",
      expect.objectContaining({
        description: "Your profile changes have been saved.",
      }),
    ),
  );
  expect(success.mock.calls[0][1]).not.toHaveProperty("richColors");
  expect(success.mock.calls[0][1]).not.toHaveProperty("position");
  expect(onSave).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("status")).toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
});

it("keeps failed saves in the inline alert without a success toast", async () => {
  HTMLElement.prototype.scrollIntoView = jest.fn();
  render(
    <Component
      language="en"
      isServer={false}
      variant="id-settings-ai-chat"
      data={{ id: "profile", title: { en: "Profile" }, slug: "profile" } as any}
      onSave={async () => {
        throw new Error("Slug is already used");
      }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  expect(await screen.findByRole("alert")).toHaveProperty(
    "textContent",
    expect.stringContaining("Slug is already used"),
  );
  expect(success).not.toHaveBeenCalled();
});

it("retains a Russian draft across refetch and saves current translations of untouched fields", async () => {
  const onSave = jest.fn().mockResolvedValue({});
  const profile = {
    id: "agent",
    title: { ru: "Алиса", en: "Alice" },
    subtitle: { ru: "До обновления" },
    description: {
      ru: '{"type":"doc","content":[{"type":"paragraph","content":[{"text":"Описание"}]}]}',
    },
    slug: "alice",
  };
  const props = {
    onSave,
    data: profile as any,
    variant: "id-settings-ai-chat" as const,
    isServer: false,
    mode: "agent" as const,
    language: "ru",
  };
  const { rerender } = render(<Component {...props} />);
  expect(screen.getByLabelText("Описание")).toHaveProperty("value", "Описание");
  fireEvent.change(screen.getByLabelText("Имя"), {
    target: { value: "Алиса Иванова" },
  });
  const latest = {
    ...profile,
    title: { ...profile.title, en: "Alice Smith" },
    subtitle: { ru: "Новый заголовок" },
  };
  rerender(<Component {...props} data={latest as any} />);
  expect(screen.getByLabelText("Имя")).toHaveProperty("value", "Алиса Иванова");
  expect(screen.getByLabelText("Заголовок")).toHaveProperty(
    "value",
    "Новый заголовок",
  );
  fireEvent.click(screen.getByRole("button", { name: "Сохранить профиль" }));
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith({
      title: { ru: "Алиса Иванова", en: "Alice Smith" },
      subtitle: latest.subtitle,
      description: profile.description,
      slug: "alice",
    }),
  );
});

it("lets an existing long role remain unchanged and checks the active translation when edited", async () => {
  const old = "x".repeat(12001);
  const onSave = jest.fn().mockResolvedValue({});
  render(
    <Component
      language="en"
      isServer={false}
      mode="agent"
      variant="id-settings-ai-chat"
      data={
        {
          title: { en: "Clerk" },
          description: { en: old, ru: old },
          slug: "clerk",
        } as any
      }
      onSave={onSave}
    />,
  );
  const description = screen.getByLabelText("Description");
  const save = screen.getByRole("button", { name: "Save profile" });
  expect(save).toHaveProperty("disabled", false);
  fireEvent.change(description, { target: { value: old + "more" } });
  expect(description.getAttribute("aria-invalid")).toBe("true");
  expect(save).toHaveProperty("disabled", true);
  fireEvent.change(description, { target: { value: old.slice(1) } });
  fireEvent.click(save);
  await waitFor(() =>
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ description: { en: old.slice(1), ru: old } }),
    ),
  );
});

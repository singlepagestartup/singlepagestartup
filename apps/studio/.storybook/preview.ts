import "../runtime/styles.css";
import "../workspace/styles/default.css";
import { createElement } from "react";
import { Toaster } from "@sps/ui-adapter/toast";

import type { Preview } from "@storybook/react";

const preview: Preview = {
  decorators: [
    (Story, context) => {
      if (!context.id.startsWith("modules-")) return createElement(Story);
      const layer = context.id.includes("-singlepage-")
        ? "singlepage"
        : "startup";
      const preview = createElement(
        "div",
        {
          "data-sps-theme": layer,
          className:
            "min-w-0 bg-muted font-default text-foreground antialiased" +
            (context.parameters.layout === "centered"
              ? " min-h-0 w-[calc(100vw-2rem)] max-w-7xl"
              : context.parameters.layout === "fullscreen"
                ? " min-h-screen w-full"
                : " min-h-0 w-full"),
        },
        createElement(Story),
        context.parameters.toastCatalog
          ? null
          : createElement(Toaster, {
              duration: context.parameters.toastDuration ?? 4500,
            }),
      );
      return layer === "singlepage"
        ? preview
        : createElement("div", { "data-sps-theme": "singlepage" }, preview);
    },
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        method: "alphabetical",
        order: [
          "Modules",
          "Workspace",
          [
            "README",
            "00 Client Request",
            ["01 Brief"],
            "10 Strategy",
            "20 Brand",
            "30 Design",
            "40 Products",
          ],
        ],
      },
    },
  },
};

export default preview;

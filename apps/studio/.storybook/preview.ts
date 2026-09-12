import "../runtime/styles.css";

import type { Preview } from "@storybook/react";

const preview: Preview = {
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

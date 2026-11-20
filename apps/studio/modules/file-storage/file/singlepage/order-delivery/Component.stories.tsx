import type { Meta, StoryObj } from "@storybook/react-vite";
import { Component as File } from "../..";
import { downloadOrderFixture } from "./fixture";
import type { IComponentProps, IOrderDownload } from "./interface";

const files: IOrderDownload[] = [
  {
    id: "strategy-v2-pdf",
    kind: "result",
    filename: "strategy-sever-v2.pdf",
    versionNumber: 2,
  },
  { id: "receipt-418-02", kind: "receipt", filename: "receipt-418-02.pdf" },
];

function Preview(props: IComponentProps) {
  return (
    <div className="mx-auto max-w-xl p-4 sm:p-8" lang="ru">
      <File {...props} variant="order-delivery" />
    </div>
  );
}

const meta = {
  id: "modules-file-storage-models-file-singlepage-order-delivery",
  title: "Modules/File-Storage/File/Singlepage/order-delivery",
  component: Preview,
  parameters: { layout: "fullscreen" },
  args: {
    state: "available",
    files,
    onDownload: (id) => {
      const file = files.find((entry) => entry.id === id);
      if (file) downloadOrderFixture(file);
    },
  },
} satisfies Meta<typeof Preview>;
export default meta;

type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Pending: Story = { args: { state: "pending", files: undefined } };
export const AccessDenied: Story = {
  args: { state: "denied", files: undefined },
};

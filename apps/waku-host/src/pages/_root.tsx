import type { CSSProperties, ReactNode } from "react";

const bodyStyle = {
  "--font-default": "Default",
  "--font-primary": "Primary",
} as CSSProperties;

export default async function RootElement(props: { children: ReactNode }) {
  return (
    <html className="scroll-smooth" lang="en">
      <head />
      <body style={bodyStyle}>{props.children}</body>
    </html>
  );
}

export const getConfig = async () => {
  return {
    render: "dynamic",
  } as const;
};
